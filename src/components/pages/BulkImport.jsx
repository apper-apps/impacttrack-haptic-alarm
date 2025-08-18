import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import { bulkImportService } from "@/services/api/bulkImportService";
import { indicatorService } from "@/services/api/indicatorService";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { dataPointService } from "@/services/api/dataPointService";
import { 
  setBulkImportLoading, 
  setBulkImportProgress, 
  setBulkImportError,
  clearBulkImportState 
} from "@/store/melSlice";

export default function BulkImport() {
  const dispatch = useDispatch();
  const { selectedCountry, selectedProject, bulkImport } = useSelector(state => state.mel);
  
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Validate, 4: Process
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReferenceData();
    return () => {
      dispatch(clearBulkImportState());
    };
  }, [dispatch]);

  async function loadReferenceData() {
    try {
      setLoading(true);
      const [indicatorsData, countriesData, projectsData] = await Promise.all([
        indicatorService.getAll(),
        countryService.getAll(),
        projectService.getAll()
      ]);
      setIndicators(indicatorsData);
      setCountries(countriesData);
      setProjects(projectsData);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load reference data");
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = useCallback(async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setLoading(true);
      dispatch(setBulkImportLoading(true));
      
      const parsedData = await bulkImportService.parseFile(uploadedFile);
      setFile(uploadedFile);
      setFileData(parsedData.data);
      setHeaders(parsedData.headers);
      
      // Initialize mappings
      const initialMappings = {};
      parsedData.headers.forEach(header => {
        // Try to auto-match common field names
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('indicator') || lowerHeader.includes('metric')) {
          initialMappings[header] = 'indicator';
        } else if (lowerHeader.includes('value') || lowerHeader.includes('amount')) {
          initialMappings[header] = 'value';
        } else if (lowerHeader.includes('date') || lowerHeader.includes('period')) {
          initialMappings[header] = 'reportingDate';
        } else if (lowerHeader.includes('country')) {
          initialMappings[header] = 'country';
        } else if (lowerHeader.includes('project')) {
          initialMappings[header] = 'project';
        } else {
          initialMappings[header] = '';
        }
      });
      setMappings(initialMappings);
      setStep(2);
      toast.success(`File uploaded successfully. ${parsedData.data.length} rows found.`);
      
    } catch (err) {
      setError(err.message);
      toast.error("Failed to parse file: " + err.message);
    } finally {
      setLoading(false);
      dispatch(setBulkImportLoading(false));
    }
  }, [dispatch]);

  const handleMappingChange = (header, fieldType) => {
    setMappings(prev => ({
      ...prev,
      [header]: fieldType
    }));
  };

  const validateMappings = () => {
    const requiredFields = ['indicator', 'value'];
    const mappedFields = Object.values(mappings).filter(v => v);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      toast.error(`Required fields missing: ${missingRequired.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleValidateData = async () => {
    if (!validateMappings()) return;

    try {
      setLoading(true);
      dispatch(setBulkImportLoading(true));
      
      const results = await bulkImportService.validateData(fileData, mappings, {
        indicators,
        countries,
        projects
      });
      
      setValidationResults(results);
      setStep(3);
      
      if (results.errors.length > 0) {
        toast.warning(`Validation completed with ${results.errors.length} errors and ${results.warnings.length} warnings`);
      } else {
        toast.success(`Validation successful! ${results.validRows.length} rows ready for import`);
      }
      
    } catch (err) {
      setError(err.message);
      toast.error("Validation failed: " + err.message);
    } finally {
      setLoading(false);
      dispatch(setBulkImportLoading(false));
    }
  };

  const handleProcessImport = async () => {
    if (!validationResults || validationResults.validRows.length === 0) {
      toast.error("No valid data to import");
      return;
    }

    try {
      setLoading(true);
      dispatch(setBulkImportLoading(true));
      setStep(4);

      const totalRows = validationResults.validRows.length;
      let processedRows = 0;

      // Process in batches to show progress
      const batchSize = 50;
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = validationResults.validRows.slice(i, i + batchSize);
        
        // Transform data for bulk creation
        const dataPoints = batch.map(row => ({
          indicatorId: getIndicatorId(row.indicator),
          countryId: row.country ? getCountryId(row.country) : selectedCountry?.Id,
          projectId: row.project ? getProjectId(row.project) : selectedProject?.Id,
          value: parseFloat(row.value),
          reportingDate: row.reportingDate || new Date().toISOString().split('T')[0],
          notes: row.notes || null,
          source: "Bulk Import"
        }));

        await dataPointService.bulkCreate(dataPoints);
        processedRows += batch.length;
        
        const progress = Math.round((processedRows / totalRows) * 100);
        dispatch(setBulkImportProgress(progress));
      }

      toast.success(`Successfully imported ${processedRows} data points`);
      
      // Reset state
      setStep(1);
      setFile(null);
      setFileData(null);
      setHeaders([]);
      setMappings({});
      setValidationResults(null);
      dispatch(clearBulkImportState());

    } catch (err) {
      dispatch(setBulkImportError(err.message));
      toast.error("Import failed: " + err.message);
    } finally {
      setLoading(false);
      dispatch(setBulkImportLoading(false));
    }
  };

  const getIndicatorId = (indicatorName) => {
    const indicator = indicators.find(i => 
      i.name.toLowerCase() === indicatorName.toLowerCase()
    );
    return indicator?.Id || null;
  };

  const getCountryId = (countryName) => {
    const country = countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country?.Id || null;
  };

  const getProjectId = (projectName) => {
    const project = projects.find(p => 
      p.name.toLowerCase() === projectName.toLowerCase()
    );
    return project?.Id || null;
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setFileData(null);
    setHeaders([]);
    setMappings({});
    setValidationResults(null);
    setError(null);
    dispatch(clearBulkImportState());
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        indicator: "People Trained in Financial Literacy",
        value: "150",
        reportingDate: "2024-01-01",
        country: "Indonesia",
        project: "Financial Inclusion Program",
        notes: "Q1 training completion"
      }
    ];
    
    bulkImportService.downloadTemplate(templateData, "bulk_import_template.csv");
    toast.success("Template downloaded successfully");
  };

  if (loading && step === 1) {
    return <Loading className="min-h-[400px]" />;
  }

  if (error && step === 1) {
    return <Error message={error} onRetry={loadReferenceData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Data Import</h1>
          <p className="text-gray-600 mt-1">
            Import multiple data points from CSV or Excel files
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            <ApperIcon name="Download" size={16} className="mr-2" />
            Download Template
          </Button>
          {step > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <ApperIcon name="RotateCcw" size={16} className="mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Upload File", icon: "Upload" },
            { num: 2, label: "Map Fields", icon: "ArrowRightLeft" },
            { num: 3, label: "Validate Data", icon: "CheckCircle" },
            { num: 4, label: "Import Data", icon: "Database" }
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s.num 
                  ? "bg-primary text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.num ? (
                  <ApperIcon name="Check" size={16} />
                ) : (
                  <ApperIcon name={s.icon} size={16} />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= s.num ? "text-gray-900" : "text-gray-500"
              }`}>
                {s.label}
              </span>
              {index < 3 && (
                <ApperIcon 
                  name="ChevronRight" 
                  size={16} 
                  className="mx-4 text-gray-300" 
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step 1: File Upload */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Data File</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ApperIcon name="Upload" size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Choose a CSV or Excel file
              </h3>
              <p className="text-gray-500 mb-4">
                Maximum file size: 10MB. Supported formats: CSV, XLS, XLSX
              </p>
              <Input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <ApperIcon name="Info" size={20} className="text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">File Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>First row should contain column headers</li>
                    <li>Required columns: Indicator name and Value</li>
                    <li>Optional columns: Date, Country, Project, Notes</li>
                    <li>Values should be numeric (for count/currency indicators)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Field Mapping */}
      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Map File Columns to Fields</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Map each column from your file to the corresponding database field.
            </p>
            <div className="grid gap-4">
              {headers.map(header => (
                <div key={header} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700">
                      {header}
                    </label>
                    <p className="text-xs text-gray-500">
                      Sample: {fileData[0]?.[header] || 'N/A'}
                    </p>
                  </div>
                  <ApperIcon name="ArrowRight" size={16} className="text-gray-400" />
                  <div className="w-1/3">
                    <Select
                      value={mappings[header] || ''}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="w-full"
                    >
                      <option value="">-- Select Field --</option>
                      <option value="indicator">Indicator Name *</option>
                      <option value="value">Value *</option>
                      <option value="reportingDate">Reporting Date</option>
                      <option value="country">Country</option>
                      <option value="project">Project</option>
                      <option value="notes">Notes</option>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleValidateData} disabled={loading}>
                {loading ? (
                  <>
                    <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <ApperIcon name="CheckCircle" size={16} className="mr-2" />
                    Validate Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Validation Results */}
      {step === 3 && validationResults && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Validation Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.validRows.length}
                </div>
                <div className="text-sm text-green-700">Valid Rows</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResults.warnings.length}
                </div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.errors.length}
                </div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {validationResults.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-900 mb-3">Errors (must be fixed):</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {validationResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResults.warnings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-yellow-900 mb-3">Warnings (can proceed):</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {validationResults.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                      Row {warning.row}: {warning.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back to Mapping
              </Button>
              <Button
                onClick={handleProcessImport}
                disabled={validationResults.validRows.length === 0 || loading}
              >
                <ApperIcon name="Database" size={16} className="mr-2" />
                Import {validationResults.validRows.length} Records
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === 4 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Processing Import</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ApperIcon name="Loader2" size={20} className="text-blue-600 mr-3 animate-spin" />
                <div>
                  <p className="font-medium text-blue-900">
                    Importing data points...
                  </p>
                  <p className="text-blue-700 text-sm">
                    Please wait while we process your data.
                  </p>
                </div>
              </div>
            </div>
            {bulkImport.progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bulkImport.progress}%` }}
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}