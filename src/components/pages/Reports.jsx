import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { indicatorService } from "@/services/api/indicatorService";
const Reports = () => {
const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Report filters
  const [filters, setFilters] = useState({
    reportType: "custom",
    country: "",
    project: "",
    period: "2024-Q1",
    format: "pdf",
    reportTitle: "Custom Report"
  });

const reportTypes = [
    { value: "custom", label: "Custom Report Builder" },
    { value: "quarterly", label: "Quarterly Report" },
    { value: "annual", label: "Annual Impact Report" },
    { value: "donor", label: "Donor Report" },
    { value: "country", label: "Country Performance" },
    { value: "project", label: "Project Summary" }
  ];

  const periods = [
    { value: "2024-Q1", label: "Q1 2024 (Jan-Mar)" },
    { value: "2023-Q4", label: "Q4 2023 (Oct-Dec)" },
    { value: "2023-Q3", label: "Q3 2023 (Jul-Sep)" },
    { value: "2023-annual", label: "Annual 2023" }
  ];

  const formats = [
    { value: "pdf", label: "PDF Document" },
    { value: "excel", label: "Excel Spreadsheet" },
    { value: "powerpoint", label: "PowerPoint Presentation" }
  ];

  const reportTemplates = [
    {
      id: 1,
      name: "Board Quarterly Report",
      description: "Executive summary with key metrics and highlights",
      icon: "PieChart",
      color: "from-primary to-secondary",
      lastGenerated: "2024-03-28"
    },
    {
      id: 2,
      name: "Donor Impact Report",
      description: "Detailed impact metrics for donor stakeholders",
      icon: "TrendingUp",
      color: "from-success to-green-600",
      lastGenerated: "2024-03-15"
    },
    {
      id: 3,
      name: "Country Performance",
      description: "Country-specific performance and progress analysis",
      icon: "Globe",
      color: "from-info to-blue-600",
      lastGenerated: "2024-03-20"
    },
    {
      id: 4,
      name: "Gender Analysis Report",
      description: "Female participation and empowerment metrics",
      icon: "Heart",
      color: "from-pink-500 to-rose-500",
      lastGenerated: "2024-03-10"
    },
    {
      id: 5,
      name: "Financial Summary",
      description: "Loan disbursements, repayments, and financial health",
      icon: "DollarSign",
      color: "from-accent to-yellow-600",
      lastGenerated: "2024-03-25"
    },
    {
      id: 6,
      name: "Training & Capacity Building",
      description: "Training sessions, participants, and outcomes",
      icon: "GraduationCap",
      color: "from-purple-500 to-indigo-600",
      lastGenerated: "2024-03-18"
    }
  ];

useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [countriesData, projectsData, indicatorsData] = await Promise.all([
          countryService.getAll(),
          projectService.getAll(),
          indicatorService.getAll()
        ]);
        setCountries(countriesData.filter(c => c.status === "active"));
        setProjects(projectsData.filter(p => p.status === "active"));
        setIndicators(indicatorsData);
      } catch (err) {
        console.error("Data loading error:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter projects by selected country
  const filteredProjects = filters.country 
    ? projects.filter(p => p.countryId === parseInt(filters.country))
    : projects;

const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      // Reset project if country changes
      ...(field === "country" && { project: "" })
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === "indicators" && destination.droppableId === "selectedIndicators") {
      const indicator = filteredIndicators[source.index];
      if (!selectedIndicators.find(ind => ind.Id === indicator.Id)) {
        setSelectedIndicators(prev => [...prev, indicator]);
        toast.success(`Added ${indicator.name} to report`);
      }
    } else if (source.droppableId === "selectedIndicators") {
      if (destination.droppableId === "selectedIndicators") {
        // Reorder within selected indicators
        const newSelectedIndicators = Array.from(selectedIndicators);
        const [reorderedItem] = newSelectedIndicators.splice(source.index, 1);
        newSelectedIndicators.splice(destination.index, 0, reorderedItem);
        setSelectedIndicators(newSelectedIndicators);
      } else if (destination.droppableId === "indicators") {
        // Remove from selected indicators
        const newSelectedIndicators = Array.from(selectedIndicators);
        const removedIndicator = newSelectedIndicators.splice(source.index, 1)[0];
        setSelectedIndicators(newSelectedIndicators);
        toast.info(`Removed ${removedIndicator.name} from report`);
      }
    }
  };

  const removeIndicator = (indicatorId) => {
    const indicator = selectedIndicators.find(ind => ind.Id === indicatorId);
    setSelectedIndicators(prev => prev.filter(ind => ind.Id !== indicatorId));
    if (indicator) {
      toast.info(`Removed ${indicator.name} from report`);
    }
  };

const handleGenerateReport = async () => {
    if (filters.reportType === "custom" && selectedIndicators.length === 0) {
      toast.warning("Please add indicators to your custom report");
      return;
    }

    setGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const reportName = filters.reportTitle || reportTypes.find(rt => rt.value === filters.reportType)?.label || "Report";
      const indicatorCount = filters.reportType === "custom" ? selectedIndicators.length : "all";
      toast.success(`${reportName} generated successfully with ${indicatorCount} indicators!`);
      
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  // Filtered indicators for the library
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         indicator.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || indicator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ["all", ...new Set(indicators.map(ind => ind.category))];

  const handleTemplateGenerate = async (template) => {
    setGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${template.name} generated successfully!`);
      
    } catch (err) {
      console.error("Template generation error:", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <Loading variant="skeleton" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export program performance reports</p>
        </div>
        <Button variant="outline">
          <ApperIcon name="History" size={16} className="mr-2" />
          Report History
        </Button>
      </div>

      {/* Quick Templates */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template) => (
            <Card key={template.id} hover className="group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${template.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <ApperIcon name={template.icon} size={24} className="text-white" />
                </div>
                <div className="text-xs text-gray-500">
                  Last: {template.lastGenerated}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleTemplateGenerate(template)}
                disabled={generating}
              >
                <ApperIcon name="FileText" size={14} className="mr-2" />
                Generate Report
              </Button>
            </Card>
          ))}
        </div>
      </div>

{/* Drag & Drop Report Designer */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Drag & Drop Report Designer</h2>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Indicator Library */}
            <Card className="lg:col-span-1">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Indicator Library</h3>
                
                <div className="space-y-3">
                  <Input
                    placeholder="Search indicators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories.map(cat => ({ 
                      value: cat, 
                      label: cat === "all" ? "All Categories" : cat 
                    }))}
                  />
                </div>
              </div>
              
              <Droppable droppableId="indicators">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`max-h-96 overflow-y-auto p-4 space-y-2 ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {filteredIndicators.map((indicator, index) => (
                      <Draggable
                        key={indicator.Id}
                        draggableId={`indicator-${indicator.Id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                            } ${
                              selectedIndicators.find(ind => ind.Id === indicator.Id) ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {indicator.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {indicator.category} • {indicator.unit}
                                </p>
                              </div>
                              <ApperIcon name="GripVertical" size={16} className="text-gray-400 ml-2" />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {filteredIndicators.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ApperIcon name="Search" size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No indicators found</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </Card>

            {/* Report Canvas */}
            <Card className="lg:col-span-2">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Report Design Canvas</h3>
                  <div className="text-sm text-gray-500">
                    {selectedIndicators.length} indicators selected
                  </div>
                </div>
              </div>
              
              <Droppable droppableId="selectedIndicators">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-96 p-4 ${
                      snapshot.isDraggingOver ? 'bg-green-50' : selectedIndicators.length === 0 ? 'bg-gray-50' : ''
                    }`}
                  >
                    {selectedIndicators.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-80 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                        <ApperIcon name="Plus" size={32} className="mb-3" />
                        <p className="text-lg font-medium">Drop indicators here</p>
                        <p className="text-sm">Drag indicators from the library to build your report</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedIndicators.map((indicator, index) => (
                        <Draggable
                          key={`selected-${indicator.Id}`}
                          draggableId={`selected-indicator-${indicator.Id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'rotate-1 shadow-lg z-50' : ''
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 cursor-grab"
                              >
                                <ApperIcon name="GripVertical" size={16} />
                              </div>
                              
                              <button
                                onClick={() => removeIndicator(indicator.Id)}
                                className="absolute top-2 right-8 p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <ApperIcon name="X" size={16} />
                              </button>
                              
                              <div className="pr-16">
                                <h4 className="font-medium text-gray-900 text-sm mb-2">
                                  {indicator.name}
                                </h4>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex justify-between">
                                    <span>Category:</span>
                                    <span className="font-medium">{indicator.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="font-medium">{indicator.type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Target:</span>
                                    <span className="font-medium">
                                      {indicator.target?.toLocaleString()} {indicator.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          </div>
        </DragDropContext>

        {/* Report Configuration & Generation */}
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Report Configuration</h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <Input
                label="Report Title"
                value={filters.reportTitle}
                onChange={(e) => handleFilterChange("reportTitle", e.target.value)}
                placeholder="Enter report title..."
                className="lg:col-span-2"
              />

              <Select
                label="Country"
                value={filters.country}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                options={[
                  { value: "", label: "All Countries" },
                  ...countries.map(c => ({ value: c.Id.toString(), label: c.name }))
                ]}
              />

              <Select
                label="Project"
                value={filters.project}
                onChange={(e) => handleFilterChange("project", e.target.value)}
                options={[
                  { value: "", label: "All Projects" },
                  ...filteredProjects.map(p => ({ value: p.Id.toString(), label: p.name }))
                ]}
                disabled={!filters.country}
              />

              <Select
                label="Period"
                value={filters.period}
                onChange={(e) => handleFilterChange("period", e.target.value)}
                options={periods}
              />

              <Select
                label="Format"
                value={filters.format}
                onChange={(e) => handleFilterChange("format", e.target.value)}
                options={formats}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Custom report with {selectedIndicators.length} indicators from {filters.period}
                {filters.country && ` for ${countries.find(c => c.Id === parseInt(filters.country))?.name}`}
                {filters.project && ` (${filteredProjects.find(p => p.Id === parseInt(filters.project))?.name})`}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline">
                  <ApperIcon name="Eye" size={16} className="mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  loading={generating}
                  disabled={selectedIndicators.length === 0}
                >
                  <ApperIcon name="Download" size={16} className="mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <Card>
          <div className="space-y-4">
            {[
              {
                name: "Q1 2024 Board Report",
                type: "Quarterly",
                generated: "2024-03-28",
                size: "2.4 MB",
                format: "PDF",
                status: "completed"
              },
              {
                name: "Cambodia Country Performance",
                type: "Country",
                generated: "2024-03-25",
                size: "1.8 MB", 
                format: "Excel",
                status: "completed"
              },
              {
                name: "Donor Impact Summary",
                type: "Donor",
                generated: "2024-03-20",
                size: "3.1 MB",
                format: "PDF", 
                status: "completed"
              }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <ApperIcon name="FileText" size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-600">
                      {report.type} • Generated {report.generated} • {report.size}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs bg-success text-white px-2 py-1 rounded-full">
                    {report.format}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ApperIcon name="Download" size={14} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ApperIcon name="Share" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;