import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { indicatorService } from "@/services/api/indicatorService";
import { dataPointService } from "@/services/api/dataPointService";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import ProgressRing from "@/components/molecules/ProgressRing";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Select from "@/components/atoms/Select";
import { setDataEntryAutoSave, setDataEntryDraft, setDataEntryProgress, setDataEntryValidation, updateDashboardMetrics, refreshDashboardData, setApprovalStatus, addToApprovalQueue } from "@/store/melSlice";

const DataEntry = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, dataEntry } = useSelector(state => state.mel);
  
  // Data state
  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-Q1");
const [dataEntries, setDataEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationRulesEngine, setValidationRulesEngine] = useState({});
  
  // Enhanced features
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  
  // Submission tracking states
const [submissionStatuses, setSubmissionStatuses] = useState({});
  const [approvalWorkflow, setApprovalWorkflow] = useState({});
  const [qualityScores, setQualityScores] = useState({});
  const [previousPeriodData, setPreviousPeriodData] = useState({});
  // Refs for auto-save
  const autoSaveTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const periods = [
    { value: "2024-Q1", label: "Q1 2024 (Jan-Mar)" },
    { value: "2023-Q4", label: "Q4 2023 (Oct-Dec)" },
    { value: "2023-Q3", label: "Q3 2023 (Jul-Sep)" },
    { value: "2023-Q2", label: "Q2 2023 (Apr-Jun)" }
  ];

  // Load initial data
// Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [countriesData, indicatorsData] = await Promise.all([
          countryService.getAll(),
          indicatorService.getAll()
        ]);

        setCountries(countriesData.filter(c => c.status === "active"));
        setIndicators(indicatorsData);

        // Set default country for country-specific users
        if (currentUser.countryId) {
          const userCountry = countriesData.find(c => c.Id === currentUser.countryId);
          if (userCountry) {
            setSelectedCountry(userCountry.Id.toString());
          }
        }
        
        // Initialize progress tracking
        dispatch(setDataEntryProgress({ 
          completed: 0, 
          total: indicatorsData.length,
          assignedToUser: indicatorsData.slice(0, 12) // First 12 assigned to user
        }));
        
      } catch (err) {
        setError(err.message);
        console.error("Data loading error:", err);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadData();
  }, [currentUser, dispatch]);

  // Load projects when country changes
// Load projects when country changes
  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedCountry) {
        setProjects([]);
        setSelectedProject("");
        setDataEntries([]);
        return;
      }

      try {
        const projectsData = await projectService.getByCountry(selectedCountry);
        setProjects(projectsData.filter(p => p.status === "active"));
        setSelectedProject("");
        setDataEntries([]);
        setValidationErrors({});
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error("Projects loading error:", err);
        toast.error("Failed to load projects");
      }
    };

    loadProjects();
  }, [selectedCountry]);
  // Initialize data entry form when project changes
// Generate form entries when project is selected
useEffect(() => {
    if (selectedProject && indicators.length > 0) {
      // Filter indicators assigned to user's role and projects
      const userAssignedIndicators = indicators
        .filter(indicator => {
          // Logic: assign indicators based on user role and project context
          if (currentUser.role === "Super Admin") return true;
          if (currentUser.role === "Country Lead") return indicator.scope?.includes("country");
          if (currentUser.role === "Project Manager") return indicator.scope?.includes("project");
          return indicator.scope?.includes("general");
        })
        .slice(0, 12); // First 12 indicators assigned to user
      
      // Load enhanced validation rules engine
      const validationEngine = {};
      userAssignedIndicators.forEach(indicator => {
        validationEngine[indicator.Id] = {
          ...indicator.validationRules,
          rangeCheck: indicator.validationRules?.range || {},
          logicalConsistency: indicator.validationRules?.consistency || [],
          completenessRules: indicator.validationRules?.completeness || {},
          qualityThresholds: indicator.validationRules?.quality || {}
        };
      });
      setValidationRulesEngine(validationEngine);
      
      const entries = userAssignedIndicators.map(indicator => ({
        indicatorId: indicator.Id,
        indicatorName: indicator.name,
        indicatorUnit: indicator.unit,
        indicatorType: indicator.type,
        value: dataEntry.draft?.[indicator.Id] || "",
        baseline: indicator.baseline,
        target: indicator.target,
        isRequired: indicator.isRequired || false,
        validationRules: indicator.validationRules || {},
        submissionStatus: submissionStatuses[indicator.Id] || "draft",
        approvalStage: approvalWorkflow[indicator.Id] || null,
        qualityScore: qualityScores[indicator.Id] || null,
        submittedAt: null,
        reviewedAt: null,
        feedback: null,
        varianceFromPrevious: null
      }));
      
      setDataEntries(entries);
      setValidationErrors({});
      
      // Load submission statuses and previous period data for comparison
      loadSubmissionStatuses(userAssignedIndicators.map(i => i.Id));
      loadPreviousPeriodData(userAssignedIndicators.map(i => i.Id));
      
      // Update progress tracking with enhanced workflow metrics
      const completedEntries = entries.filter(entry => entry.value && entry.value !== "");
      const approvedEntries = entries.filter(entry => submissionStatuses[entry.indicatorId] === "approved");
      const pendingReview = entries.filter(entry => submissionStatuses[entry.indicatorId] === "submitted" || submissionStatuses[entry.indicatorId] === "in_review");
      
      dispatch(setDataEntryProgress({ 
        completed: completedEntries.length, 
        total: entries.length,
        assignedToUser: userAssignedIndicators,
        approved: approvedEntries.length,
        pendingReview: pendingReview.length,
        submissionWorkflow: {
          draft: entries.filter(e => !submissionStatuses[e.indicatorId] || submissionStatuses[e.indicatorId] === "draft").length,
          submitted: entries.filter(e => submissionStatuses[e.indicatorId] === "submitted").length,
          inReview: entries.filter(e => submissionStatuses[e.indicatorId] === "in_review").length,
          approved: approvedEntries.length,
          rejected: entries.filter(e => submissionStatuses[e.indicatorId] === "rejected").length
        },
        qualityMetrics: {
          averageQualityScore: calculateAverageQualityScore(entries),
          completenessRate: (completedEntries.length / entries.length) * 100,
          validationPassRate: calculateValidationPassRate(entries)
        }
      }));
      
    } else {
      setDataEntries([]);
      setValidationErrors({});
      setSubmissionStatuses({});
      setApprovalWorkflow({});
      setQualityScores({});
      setPreviousPeriodData({});
    }
  }, [selectedProject, indicators, currentUser.role, dataEntry.draft, dispatch]);

// Load submission statuses for indicators
  const loadSubmissionStatuses = useCallback(async (indicatorIds) => {
    try {
      const statusPromises = indicatorIds.map(async (indicatorId) => {
        const dataPoints = await dataPointService.getAll();
        const existingPoint = dataPoints.find(dp => 
          dp.indicatorId === indicatorId && 
          dp.projectId === selectedProject?.Id &&
          dp.countryId === selectedCountry?.Id
        );
        return {
          indicatorId,
          status: existingPoint?.status || "draft",
          workflow: existingPoint?.approvalWorkflow || null,
          submittedAt: existingPoint?.submittedAt || null,
          reviewedAt: existingPoint?.reviewedAt || null,
          feedback: existingPoint?.feedback || null,
          qualityScore: existingPoint?.qualityScore || null,
          auditTrail: existingPoint?.auditTrail || []
        };
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      const workflowMap = {};
      const qualityMap = {};

      statuses.forEach(({ indicatorId, status, workflow, submittedAt, reviewedAt, feedback, qualityScore }) => {
        statusMap[indicatorId] = status;
        workflowMap[indicatorId] = {
          stage: workflow,
          submittedAt,
          reviewedAt,
          feedback
        };
        qualityMap[indicatorId] = qualityScore;
      });

      setSubmissionStatuses(statusMap);
      setApprovalWorkflow(workflowMap);
      setQualityScores(qualityMap);
    } catch (error) {
      console.error("Error loading submission statuses:", error);
    }
  }, [selectedProject?.Id, selectedCountry?.Id]);

// Load previous period data for variance analysis
  const loadPreviousPeriodData = useCallback(async (indicatorIds) => {
    try {
      const currentPeriod = selectedPeriod;
      const previousPeriod = getPreviousPeriod(currentPeriod);
      
      if (!previousPeriod) return;

      const previousDataPromises = indicatorIds.map(async (indicatorId) => {
        const dataPoints = await dataPointService.getAll();
        const previousPoint = dataPoints.find(dp => 
          dp.indicatorId === indicatorId && 
          dp.projectId === selectedProject?.Id &&
          dp.countryId === selectedCountry?.Id &&
          dp.period === previousPeriod &&
          dp.status === "approved"
        );
        return {
          indicatorId,
          previousValue: previousPoint?.value || null,
          previousPeriod: previousPeriod
        };
      });

      const previousData = await Promise.all(previousDataPromises);
      const previousDataMap = {};

      previousData.forEach(({ indicatorId, previousValue, previousPeriod }) => {
        previousDataMap[indicatorId] = {
          value: previousValue,
          period: previousPeriod
        };
      });

      setPreviousPeriodData(previousDataMap);
    } catch (error) {
      console.error("Error loading previous period data:", error);
    }
  }, [selectedPeriod, selectedProject?.Id, selectedCountry?.Id]);

// Helper functions for quality metrics
  const calculateAverageQualityScore = useCallback((entries) => {
    const scores = entries.filter(e => qualityScores[e.indicatorId]).map(e => qualityScores[e.indicatorId]);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }, [qualityScores]);

  const calculateValidationPassRate = useCallback((entries) => {
    const validatedEntries = entries.filter(e => e.value && validateEntry(e) === null);
    return entries.length > 0 ? (validatedEntries.length / entries.length) * 100 : 0;
  }, [previousPeriodData, validationRulesEngine, dataEntries]);

  const getPreviousPeriod = (currentPeriod) => {
    const [year, quarter] = currentPeriod.split('-Q');
    const quarterNum = parseInt(quarter);
    
    if (quarterNum === 1) {
      return `${parseInt(year) - 1}-Q4`;
    } else {
      return `${year}-Q${quarterNum - 1}`;
    }
  };

// Auto-save functionality
  const saveDraft = useCallback(async () => {
    if (isInitialLoadRef.current || !hasUnsavedChanges) return;
    
    setIsDraftSaving(true);
    try {
      const draftData = {};
      dataEntries.forEach(entry => {
        if (entry.value && entry.value !== "") {
          draftData[entry.indicatorId] = entry.value;
        }
      });
      
      // Simulate API call to save draft
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch(setDataEntryDraft(draftData));
      dispatch(setDataEntryAutoSave({ 
        lastSaved: new Date().toISOString(),
        isDirty: false 
      }));
      
      setLastSavedTime(new Date());
      setHasUnsavedChanges(false);
      
    } catch (err) {
      console.error("Auto-save error:", err);
    } finally {
      setIsDraftSaving(false);
    }
  }, [dataEntries, hasUnsavedChanges, dispatch]);

  // Auto-save timer
  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSaveTimerRef.current = setTimeout(saveDraft, 30000); // 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, saveDraft]);

  const handleValueChange = (indicatorId, value) => {
    setDataEntries(prev => prev.map(entry => 
      entry.indicatorId === indicatorId 
        ? { ...entry, value } 
        : entry
    ));
    
    // Real-time validation
    const entry = dataEntries.find(e => e.indicatorId === indicatorId);
    if (entry) {
      const error = validateEntry({ ...entry, value });
      setValidationErrors(prev => ({
        ...prev,
        [indicatorId]: error
      }));
    }
    
    setHasUnsavedChanges(true);
    dispatch(setDataEntryAutoSave({ isDirty: true }));
    
    // Update progress
    const newEntries = dataEntries.map(entry => 
      entry.indicatorId === indicatorId ? { ...entry, value } : entry
    );
    const completedEntries = newEntries.filter(entry => entry.value && entry.value !== "");
    dispatch(setDataEntryProgress({ 
      completed: completedEntries.length, 
      total: newEntries.length
    }));
  };

const validateEntry = (entry) => {
    // Basic required field validation
    if (entry.isRequired && (!entry.value || entry.value === "")) {
      return "This field is required";
    }
    
    if (!entry.value || entry.value === "") {
      return null; // Optional fields can be empty
    }

    const numValue = parseFloat(entry.value);
    if (isNaN(numValue)) {
      return "Value must be a valid number";
    }

    // Enhanced validation rules engine
    const rules = validationRulesEngine[entry.indicatorId] || {};
    
    // Range validation
    if (rules.rangeCheck) {
      if (rules.rangeCheck.min !== undefined && numValue < rules.rangeCheck.min) {
        return `Value must be at least ${rules.rangeCheck.min}`;
      }
      if (rules.rangeCheck.max !== undefined && numValue > rules.rangeCheck.max) {
        return `Value cannot exceed ${rules.rangeCheck.max}`;
      }
    }

    // Type-specific validation
    if (numValue < 0 && !rules.allowNegative) {
      return "Value cannot be negative";
    }

    if (entry.indicatorType === "percentage" && numValue > 100) {
      return "Percentage cannot exceed 100%";
    }
    
    // Previous period variance validation
    const previousData = previousPeriodData[entry.indicatorId];
    if (previousData?.value && rules.varianceThreshold) {
      const variance = Math.abs((numValue - previousData.value) / previousData.value) * 100;
      if (variance > rules.varianceThreshold) {
        return `Variance of ${variance.toFixed(1)}% from previous period exceeds threshold of ${rules.varianceThreshold}%`;
      }
    }

    // Logical consistency validation
    if (rules.logicalConsistency && rules.logicalConsistency.length > 0) {
      for (const consistencyRule of rules.logicalConsistency) {
        const relatedEntry = dataEntries.find(e => e.indicatorId === consistencyRule.relatedIndicatorId);
        if (relatedEntry && relatedEntry.value) {
          const relatedValue = parseFloat(relatedEntry.value);
          
          switch (consistencyRule.operator) {
            case 'equals':
              if (numValue !== relatedValue) {
                return `Value must equal ${consistencyRule.relatedIndicatorName}`;
              }
              break;
            case 'sum_equals':
              const sumIndicators = consistencyRule.sumOf.map(id => 
                dataEntries.find(e => e.indicatorId === id)
              ).filter(e => e && e.value);
              
              if (sumIndicators.length === consistencyRule.sumOf.length) {
                const sum = sumIndicators.reduce((total, e) => total + parseFloat(e.value), 0);
                if (numValue !== sum) {
                  return `Total must equal sum of related indicators`;
                }
              }
              break;
          }
        }
      }
    }
    
    // Custom validation rules (backward compatibility)
    if (entry.validationRules) {
      if (entry.validationRules.min && numValue < entry.validationRules.min) {
        return `Value must be at least ${entry.validationRules.min}`;
      }
      if (entry.validationRules.max && numValue > entry.validationRules.max) {
        return `Value cannot exceed ${entry.validationRules.max}`;
      }
    }

    return null;
  };

  // Calculate data quality score
  const calculateQualityScore = (entry) => {
    let score = 100;
    
    // Completeness (40% weight)
    if (!entry.value || entry.value === "") {
      score -= 40;
    }
    
    // Timeliness (20% weight)
    const submissionDeadline = new Date(); // Could be configured per project
    const submissionDate = new Date(entry.submittedAt || Date.now());
    if (submissionDate > submissionDeadline) {
      score -= 20;
    }
    
    // Consistency (40% weight)
    const validationError = validateEntry(entry);
    if (validationError) {
      score -= 40;
    } else {
      // Additional consistency checks
      const previousData = previousPeriodData[entry.indicatorId];
      if (previousData?.value) {
        const variance = Math.abs((parseFloat(entry.value) - previousData.value) / previousData.value) * 100;
        if (variance > 50) { // High variance reduces quality score
          score -= Math.min(20, variance / 5);
        }
      }
    }
    
    return Math.max(0, Math.round(score));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to save them before submitting?"
      );
      if (confirmed) {
        await saveDraft();
      }
    }
    
    // Enhanced validation with quality scoring
    const newValidationErrors = {};
    let hasErrors = false;
    const qualityScoresTemp = {};
    
    dataEntries.forEach((entry) => {
      const error = validateEntry(entry);
      if (error) {
        newValidationErrors[entry.indicatorId] = error;
        hasErrors = true;
      }
      
      // Calculate quality score for each entry
      if (entry.value && entry.value !== "") {
        qualityScoresTemp[entry.indicatorId] = calculateQualityScore(entry);
      }
    });
    
    setValidationErrors(newValidationErrors);
    setQualityScores(prev => ({ ...prev, ...qualityScoresTemp }));
    
    if (hasErrors) {
      const firstError = Object.values(newValidationErrors)[0];
      toast.error(`Validation error: ${firstError}`);
      return;
    }

    setSubmitting(true);
    try {
      const validEntries = dataEntries.filter(entry => entry.value && entry.value !== "");
      
      if (validEntries.length === 0) {
        toast.error("Please enter at least one value before submitting");
        return;
      }
      
// Submit data for approval workflow - handle resubmissions
      const promises = validEntries.map(entry => {
        const currentStatus = submissionStatuses[entry.indicatorId];
        const isResubmission = currentStatus === "rejected" || currentStatus === "changes_requested";
        
        return dataPointService.create({
          indicatorId: entry.indicatorId,
          projectId: parseInt(selectedProject),
          countryId: selectedCountry?.Id,
          value: parseFloat(entry.value),
          period: selectedPeriod,
          submittedBy: currentUser.name,
          status: "submitted", // Always submitted for workflow
          submittedAt: new Date().toISOString(),
          approvalWorkflow: "submitted",
          qualityScore: qualityScoresTemp[entry.indicatorId] || 85,
          previousPeriodValue: previousPeriodData[entry.indicatorId]?.value || null,
          varianceFromPrevious: previousPeriodData[entry.indicatorId]?.value 
            ? ((parseFloat(entry.value) - previousPeriodData[entry.indicatorId].value) / previousPeriodData[entry.indicatorId].value * 100)
            : null,
          auditTrail: [{
            action: isResubmission ? "resubmitted" : "submitted",
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            comment: isResubmission ? "Resubmitted after addressing feedback" : "Initial submission for review"
          }]
        });
      });

      const createdDataPoints = await Promise.all(promises);
      
// Add to approval queue in Redux with serialized values
      validEntries.forEach((entry, index) => {
        const dataPoint = createdDataPoints[index];
        dispatch(addToApprovalQueue({
          dataPointId: String(dataPoint.Id),
          indicatorId: String(entry.indicatorId),
          indicatorName: String(entry.indicatorName),
          projectId: Number(selectedProject),
          countryId: selectedCountry?.Id ? Number(selectedCountry.Id) : null,
          value: Number(entry.value),
          submittedBy: String(currentUser.name || ''),
          submittedAt: new Date().toISOString(),
          priority: String(entry.isRequired ? "high" : "medium"),
          qualityScore: Number(qualityScoresTemp[entry.indicatorId] || 85),
          previousValue: previousPeriodData[entry.indicatorId]?.value ? Number(previousPeriodData[entry.indicatorId].value) : null,
          variance: previousPeriodData[entry.indicatorId]?.value 
            ? Number(((parseFloat(entry.value) - previousPeriodData[entry.indicatorId].value) / previousPeriodData[entry.indicatorId].value * 100))
            : null
        }));
      });
      
      // Update submission statuses and approval workflow
      const newSubmissionStatuses = { ...submissionStatuses };
      const newApprovalWorkflow = { ...approvalWorkflow };
validEntries.forEach((entry, index) => {
        const dataPointId = createdDataPoints[index].Id;
        newSubmissionStatuses[entry.indicatorId] = String("submitted");
        newApprovalWorkflow[entry.indicatorId] = {
          stage: String("submitted"),
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
          approvedAt: null,
          feedback: null,
          dataPointId: String(dataPointId)
        };
        
        // Dispatch approval status with properly serialized values
        dispatch(setApprovalStatus({
          dataPointId: String(dataPointId),
          status: String("submitted"),
          approvedBy: null,
          feedback: null,
          approvedAt: null,
          rejectedAt: null
        }));
      });
      
      setSubmissionStatuses(newSubmissionStatuses);
      setApprovalWorkflow(newApprovalWorkflow);
      
      toast.success(
        `Successfully submitted ${validEntries.length} data points for review and approval!`,
        { autoClose: 4000 }
      );
      
      toast.info(
        `Your data is now in the approval queue. Check the Approval Queue to track review progress.`,
        { autoClose: 6000 }
      );
      
      // Update progress tracking for workflow
      dispatch(setDataEntryProgress({ 
        completed: dataEntries.length, 
        total: dataEntries.length,
        submitted: validEntries.length,
        pendingReview: validEntries.length,
        approved: 0,
        submissionWorkflow: {
          draft: dataEntries.length - validEntries.length,
          submitted: validEntries.length,
          inReview: 0,
          approved: 0,
          rejected: 0
        }
      }));
      
      dispatch(setDataEntryDraft({}));
      dispatch(setDataEntryAutoSave({ lastSaved: null, isDirty: false }));
      
      // Reset form values but maintain approval tracking
      setDataEntries(prev => prev.map(entry => {
        const wasSubmitted = validEntries.some(ve => ve.indicatorId === entry.indicatorId);
        return {
          ...entry, 
          value: wasSubmitted ? "" : entry.value,
          submissionStatus: newSubmissionStatuses[entry.indicatorId] || "draft",
          approvalStage: newApprovalWorkflow[entry.indicatorId] || null
        };
      }));
      setValidationErrors({});
      setHasUnsavedChanges(false);
      setLastSavedTime(null);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit data for approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Manual save function
  const handleManualSave = async () => {
    await saveDraft();
    toast.success("Draft saved successfully");
  };

  const formatValue = (value, type, unit) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    if (type === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
      }).format(num);
    }

    if (type === "percentage") {
      return `${num}%`;
    }

    if (num >= 1000) {
      return num.toLocaleString();
    }

    return num.toString();
  };

  if (loading) {
    return <Loading variant="skeleton" />;
  }

  if (error) {
    return (
      <Error 
        message={error} 
        title="Failed to load data entry form"
      />
    );
  }

  return (
<div className="space-y-6">
      {/* Enhanced Header with Progress */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Submit Data</h1>
            <p className="text-blue-100 mb-4">Complete data submission system with intelligent validation</p>
            
            {/* Form Context Display */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Calendar" size={16} />
                <span>Period: {selectedPeriod}</span>
              </div>
              {selectedProject && (
                <div className="flex items-center space-x-2">
                  <ApperIcon name="FolderOpen" size={16} />
                  <span>Project: {projects.find(p => p.Id.toString() === selectedProject)?.name}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <ApperIcon name="Clock" size={16} />
                <span>Deadline: March 31, 2024</span>
              </div>
            </div>
          </div>
          
          {/* Progress Ring */}
          <div className="text-center">
            <ProgressRing 
              progress={dataEntry.progress ? (dataEntry.progress.completed / dataEntry.progress.total) * 100 : 0} 
              size={80}
              strokeWidth={6}
            />
            <div className="mt-2 text-sm">
              {dataEntry.progress ? dataEntry.progress.completed : 0}/{dataEntry.progress ? dataEntry.progress.total : 12} Complete
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-warning">
              <ApperIcon name="AlertCircle" size={16} />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
          
          {isDraftSaving && (
            <div className="flex items-center space-x-2 text-info">
              <ApperIcon name="Clock" size={16} className="animate-spin" />
              <span className="text-sm">Saving draft...</span>
            </div>
          )}
          
          {lastSavedTime && !hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-success">
              <ApperIcon name="CheckCircle" size={16} />
              <span className="text-sm">
                Saved {lastSavedTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualSave}
            disabled={!hasUnsavedChanges}
          >
            <ApperIcon name="Save" size={16} className="mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" size="sm">
            <ApperIcon name="Download" size={16} className="mr-2" />
            Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bulk-import')}
          >
            <ApperIcon name="Upload" size={16} className="mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Selection Form */}
{/* Smart Controls with Hierarchical Selection */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Configuration</h3>
          <p className="text-sm text-gray-600">Select your context to view assigned indicators</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            options={countries.map(c => ({ value: c.Id.toString(), label: c.name }))}
            placeholder="Select country..."
            disabled={currentUser.countryId !== null}
            error={!selectedCountry ? "Country selection required" : null}
          />

          <Select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={projects.map(p => ({ 
              value: p.Id.toString(), 
              label: `${p.name} (${p.status})`
            }))}
            placeholder={!selectedCountry ? "Select country first..." : "Select project..."}
            disabled={!selectedCountry}
            error={selectedCountry && !selectedProject ? "Project selection required" : null}
          />

          <Select
            label="Reporting Period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periods}
            error={!selectedPeriod ? "Period selection required" : null}
          />
        </div>
      </Card>

      {/* Data Entry Grid */}
{/* Dynamic Form Builder */}
      {selectedProject && dataEntries.length > 0 && (
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Context-Aware Data Submission
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing {dataEntries.length} indicators assigned to your role. 
                    Required fields marked with <span className="text-error">*</span>
                  </p>
                </div>
                
                {/* Estimated completion time */}
                <div className="text-right">
                  <div className="text-sm text-gray-500">Est. completion time</div>
                  <div className="text-lg font-semibold text-info">
                    {Math.ceil(dataEntries.length * 1.5)} min
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Indicator
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Baseline
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Target
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Your Value
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Progress
                    </th>
<th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Quality & Status
                    </th>
                  </tr>
                </thead>
                <tbody>
{dataEntries.map((entry, index) => {
                    const progress = entry.value && entry.target ? 
                      Math.round((parseFloat(entry.value) / entry.target) * 100) : 0;
                    const hasError = validationErrors[entry.indicatorId];
                    const isCompleted = entry.value && entry.value !== "" && !hasError;
                    const submissionStatus = submissionStatuses[entry.indicatorId] || "draft";
                    const workflowData = approvalWorkflow[entry.indicatorId];
                    const qualityScore = qualityScores[entry.indicatorId];
                    const previousData = previousPeriodData[entry.indicatorId];
                    
                    // Calculate variance for display
                    const variance = previousData?.value && entry.value 
                      ? ((parseFloat(entry.value) - previousData.value) / previousData.value * 100)
                      : null;
                    
                    // Determine row styling based on submission status and quality
                    const getRowClass = () => {
                      if (hasError) return 'bg-red-50';
                      if (submissionStatus === "approved") return 'bg-green-50';
                      if (submissionStatus === "rejected") return 'bg-red-50';
                      if (submissionStatus === "in_review") return 'bg-blue-50';
                      if (submissionStatus === "submitted") return 'bg-yellow-50';
                      if (qualityScore && qualityScore < 70) return 'bg-orange-50';
                      if (isCompleted) return 'bg-green-50';
                      return '';
                    };
                    
                    return (
                      <tr 
                        key={entry.indicatorId} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${getRowClass()}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {submissionStatus === "approved" ? (
                                <ApperIcon name="CheckCircle2" size={16} className="text-success" />
                              ) : submissionStatus === "rejected" ? (
                                <ApperIcon name="XCircle" size={16} className="text-error" />
                              ) : submissionStatus === "in_review" ? (
                                <ApperIcon name="Clock" size={16} className="text-info" />
                              ) : submissionStatus === "submitted" ? (
                                <ApperIcon name="Send" size={16} className="text-warning" />
                              ) : isCompleted ? (
                                <ApperIcon name="CheckCircle" size={16} className="text-success" />
                              ) : hasError ? (
                                <ApperIcon name="XCircle" size={16} className="text-error" />
                              ) : (
                                <ApperIcon name="Circle" size={16} className="text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 flex items-center">
                                {entry.indicatorName}
                                {entry.isRequired && <span className="text-error ml-1">*</span>}
                              </div>
                              <div className="text-sm text-gray-600">
                                Unit: {entry.indicatorUnit} • Type: {entry.indicatorType}
                              </div>
                              {workflowData?.feedback && (
                                <div className="text-sm text-blue-600 mt-1">
                                  <ApperIcon name="MessageSquare" size={12} className="inline mr-1" />
                                  Feedback available
                                </div>
                              )}
                              {variance !== null && Math.abs(variance) > 20 && (
                                <div className="text-sm text-orange-600 mt-1">
                                  <ApperIcon name="TrendingUp" size={12} className="inline mr-1" />
                                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}% vs previous
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600 font-medium">
                          <div>
                            {formatValue(entry.baseline, entry.indicatorType, entry.indicatorUnit)}
                          </div>
                          {previousData?.value && (
                            <div className="text-xs text-gray-500 mt-1">
                              Previous: {formatValue(previousData.value, entry.indicatorType, entry.indicatorUnit)}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600 font-medium">
                          {formatValue(entry.target, entry.indicatorType, entry.indicatorUnit)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              value={entry.value}
                              onChange={(e) => handleValueChange(entry.indicatorId, e.target.value)}
                              placeholder={`Enter ${entry.indicatorUnit.toLowerCase()}...`}
                              className={`text-center ${hasError ? 'border-error' : ''}`}
                              min="0"
                              step={entry.indicatorType === "currency" ? "0.01" : "1"}
disabled={submissionStatus === "submitted" || submissionStatus === "in_review" || submissionStatus === "approved"}
                            />
                            {hasError && (
                              <div className="text-xs text-error">{hasError}</div>
                            )}
{workflowData?.feedback && (
                              <div className={`text-xs p-2 rounded mt-1 ${
                                submissionStatus === "rejected" ? "text-red-600 bg-red-50" :
                                submissionStatus === "changes_requested" ? "text-orange-600 bg-orange-50" :
                                "text-blue-600 bg-blue-50"
                              }`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <ApperIcon 
                                    name={submissionStatus === "rejected" ? "XCircle" : 
                                          submissionStatus === "changes_requested" ? "AlertCircle" : "MessageSquare"} 
                                    size={12} 
                                  />
                                  <strong>
                                    {submissionStatus === "rejected" ? "Rejected:" : 
                                     submissionStatus === "changes_requested" ? "Changes Requested:" : "Feedback:"}
                                  </strong>
                                </div>
                                {workflowData.feedback}
                                {(submissionStatus === "rejected" || submissionStatus === "changes_requested") && (
                                  <div className="mt-1 text-xs opacity-75">
                                    Please address the feedback above and resubmit.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          {entry.value && !hasError && (
                            <div className="flex items-center justify-center">
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                progress >= 100 ? "bg-success text-white" :
                                progress >= 75 ? "bg-warning text-white" :
                                progress >= 50 ? "bg-info text-white" :
                                "bg-gray-200 text-gray-700"
                              }`}>
                                {progress}%
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="space-y-2">
                            {/* Quality Score */}
                            {qualityScore && (
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                qualityScore >= 90 ? "bg-success text-white" :
                                qualityScore >= 75 ? "bg-info text-white" :
                                qualityScore >= 60 ? "bg-warning text-white" :
                                "bg-error text-white"
                              }`}>
                                Quality: {qualityScore}%
                              </div>
                            )}
                            
                            {/* Submission Status Badge */}
                            <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                              submissionStatus === "approved" ? "bg-success text-white" :
                              submissionStatus === "rejected" ? "bg-error text-white" :
                              submissionStatus === "in_review" ? "bg-info text-white" :
                              submissionStatus === "submitted" ? "bg-warning text-white" :
                              isCompleted ? "bg-gray-200 text-gray-700" :
                              hasError ? "bg-error text-white" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {submissionStatus === "approved" && <ApperIcon name="Check" size={12} />}
                              {submissionStatus === "rejected" && <ApperIcon name="X" size={12} />}
                              {submissionStatus === "in_review" && <ApperIcon name="Eye" size={12} />}
                              {submissionStatus === "submitted" && <ApperIcon name="Send" size={12} />}
                              {submissionStatus === "approved" ? "Approved" :
                               submissionStatus === "rejected" ? "Rejected" :
                               submissionStatus === "in_review" ? "In Review" :
                               submissionStatus === "submitted" ? "Submitted" :
                               isCompleted ? "Ready" :
                               hasError ? "Error" :
                               "Draft"}
                            </div>
                            
                            {/* Workflow Timing */}
                            {workflowData?.submittedAt && (
                              <div className="text-xs text-gray-500">
                                {submissionStatus === "approved" || submissionStatus === "rejected" ? "Reviewed" : "Submitted"}: {
                                  format(parseISO(workflowData.reviewedAt || workflowData.submittedAt), 'MMM d')
                                }
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

{/* Enhanced Submit Section */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {dataEntries.filter(entry => entry.value && entry.value !== "" && !validationErrors[entry.indicatorId]).length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {Object.keys(validationErrors).filter(key => validationErrors[key]).length}
                    </div>
                    <div className="text-sm text-gray-600">With Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">
                      {dataEntries.filter(entry => !entry.value || entry.value === "").length}
                    </div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
<ApperIcon name="Info" size={16} className="inline mr-1" />
                    Data will be submitted to the Approval Queue for comprehensive review and quality validation
                  </div>
                  <div className="text-sm text-info">
                    <ApperIcon name="Shield" size={16} className="inline mr-1" />
                    Auto-save enabled every 30 seconds
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
                        setDataEntries(prev => prev.map(entry => ({ ...entry, value: "" })));
                        setValidationErrors({});
                        setHasUnsavedChanges(false);
                        dispatch(setDataEntryDraft({}));
                      }
                    }}
                  >
                    <ApperIcon name="Trash2" size={16} className="mr-2" />
                    Clear All
                  </Button>
                  
                  <Button 
                    type="submit" 
                    loading={submitting}
                    disabled={!dataEntries.some(entry => entry.value) || Object.keys(validationErrors).some(key => validationErrors[key])}
                    className="min-w-[160px]"
                  >
                    <ApperIcon name="Send" size={16} className="mr-2" />
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProject && (
        <Card className="text-center py-12">
          <ApperIcon name="PlusCircle" size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Enter Data</h3>
          <p className="text-gray-600 mb-6">
            Select a country and project above to begin entering performance data.
          </p>
        </Card>
      )}
    </div>
  );
};

export default DataEntry;