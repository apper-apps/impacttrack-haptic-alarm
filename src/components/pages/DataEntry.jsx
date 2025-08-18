import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { indicatorService } from "@/services/api/indicatorService";
import { dataPointService } from "@/services/api/dataPointService";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Select from "@/components/atoms/Select";

const DataEntry = () => {
  const { currentUser } = useSelector((state) => state.mel);
  const navigate = useNavigate();
  // Data loading state
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

  const periods = [
    { value: "2024-Q1", label: "Q1 2024 (Jan-Mar)" },
    { value: "2023-Q4", label: "Q4 2023 (Oct-Dec)" },
    { value: "2023-Q3", label: "Q3 2023 (Jul-Sep)" },
    { value: "2023-Q2", label: "Q2 2023 (Apr-Jun)" }
  ];

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
      } catch (err) {
        setError(err.message);
        console.error("Data loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

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
      } catch (err) {
        console.error("Projects loading error:", err);
        toast.error("Failed to load projects");
      }
    };

    loadProjects();
  }, [selectedCountry]);

  // Initialize data entry form when project changes
  useEffect(() => {
    if (selectedProject && indicators.length > 0) {
      const relevantIndicators = indicators.slice(0, 8); // Show first 8 indicators
      const entries = relevantIndicators.map(indicator => ({
        indicatorId: indicator.Id,
        indicatorName: indicator.name,
        indicatorUnit: indicator.unit,
        indicatorType: indicator.type,
        value: "",
        baseline: indicator.baseline,
        target: indicator.target
      }));
      setDataEntries(entries);
    } else {
      setDataEntries([]);
    }
  }, [selectedProject, indicators]);

  const handleValueChange = (indicatorId, value) => {
    setDataEntries(prev => prev.map(entry => 
      entry.indicatorId === indicatorId 
        ? { ...entry, value } 
        : entry
    ));
  };

  const validateEntry = (entry) => {
    if (!entry.value || entry.value === "") {
      return "Value is required";
    }

    const numValue = parseFloat(entry.value);
    if (isNaN(numValue)) {
      return "Value must be a number";
    }

    if (numValue < 0) {
      return "Value cannot be negative";
    }

    if (entry.indicatorType === "percentage" && numValue > 100) {
      return "Percentage cannot exceed 100%";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all entries
    const validationErrors = [];
    dataEntries.forEach((entry, index) => {
      const error = validateEntry(entry);
      if (error) {
        validationErrors.push(`Row ${index + 1}: ${error}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const promises = dataEntries
        .filter(entry => entry.value && entry.value !== "")
        .map(entry => dataPointService.create({
          indicatorId: entry.indicatorId,
          projectId: parseInt(selectedProject),
          value: parseFloat(entry.value),
          period: selectedPeriod,
          submittedBy: currentUser.name
        }));

      await Promise.all(promises);
      
      toast.success(`Successfully submitted ${promises.length} data points for review`);
      
      // Reset form
      setDataEntries(prev => prev.map(entry => ({ ...entry, value: "" })));
      
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit data. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Entry</h1>
          <p className="text-gray-600 mt-1">Submit program performance data for review</p>
        </div>
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

      {/* Selection Form */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            options={countries.map(c => ({ value: c.Id.toString(), label: c.name }))}
            placeholder="Select country..."
            disabled={currentUser.countryId !== null}
          />

          <Select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={projects.map(p => ({ value: p.Id.toString(), label: p.name }))}
            placeholder="Select project..."
            disabled={!selectedCountry}
          />

          <Select
            label="Reporting Period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periods}
          />
        </div>
      </Card>

      {/* Data Entry Grid */}
      {selectedProject && dataEntries.length > 0 && (
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Entry Form</h3>
              <p className="text-sm text-gray-600">
                Enter values for each indicator. All fields are optional but recommended.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Indicator</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Baseline</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Target</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Actual Value</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {dataEntries.map((entry, index) => {
                    const progress = entry.value && entry.target ? 
                      Math.round((parseFloat(entry.value) / entry.target) * 100) : 0;
                    
                    return (
                      <tr key={entry.indicatorId} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{entry.indicatorName}</div>
                          <div className="text-sm text-gray-600">Unit: {entry.indicatorUnit}</div>
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600">
                          {formatValue(entry.baseline, entry.indicatorType, entry.indicatorUnit)}
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600">
                          {formatValue(entry.target, entry.indicatorType, entry.indicatorUnit)}
                        </td>
                        <td className="py-4 px-4">
                          <Input
                            type="number"
                            value={entry.value}
                            onChange={(e) => handleValueChange(entry.indicatorId, e.target.value)}
                            placeholder="Enter value..."
                            className="text-center"
                            min="0"
                            step={entry.indicatorType === "currency" ? "0.01" : "1"}
                          />
                        </td>
                        <td className="text-center py-4 px-4">
                          {entry.value && (
                            <div className="flex items-center justify-center">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Data will be submitted for review and approval by the MEL Lead
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setDataEntries(prev => prev.map(entry => ({ ...entry, value: "" })))}
                >
                  Clear All
                </Button>
                <Button 
                  type="submit" 
                  loading={submitting}
                  disabled={!dataEntries.some(entry => entry.value)}
                >
                  <ApperIcon name="Send" size={16} className="mr-2" />
                  Submit for Review
                </Button>
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