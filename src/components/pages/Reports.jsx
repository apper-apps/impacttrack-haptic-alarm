import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { indicatorService } from "@/services/api/indicatorService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Select from "@/components/atoms/Select";
import { addReportToHistory, setReportQueue, updateReportProgress } from "@/store/melSlice";
const Reports = () => {
const dispatch = useDispatch();
  const { reports } = useSelector(state => state.mel);
  
  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("templates");

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
      name: "Board Report",
      description: "Executive summary with key metrics and highlights",
      icon: "PieChart",
      color: "from-primary to-secondary",
      lastGenerated: "2024-03-28",
      indicatorCount: 8,
      estimatedTime: "3 min"
    },
    {
      id: 2,
      name: "Quarterly Impact",
      description: "Comprehensive quarterly performance analysis",
      icon: "TrendingUp",
      color: "from-success to-green-600",
      lastGenerated: "2024-03-15",
      indicatorCount: 12,
      estimatedTime: "5 min"
    },
    {
      id: 3,
      name: "Annual Summary",
      description: "Year-end performance and achievements report",
      icon: "Calendar",
      color: "from-info to-blue-600",
      lastGenerated: "2024-03-20",
      indicatorCount: 15,
      estimatedTime: "7 min"
    },
    {
      id: 4,
      name: "Donor Report",
      description: "Detailed impact metrics for donor stakeholders",
      icon: "Heart",
      color: "from-pink-500 to-rose-500",
      lastGenerated: "2024-03-10",
      indicatorCount: 10,
      estimatedTime: "4 min"
    },
    {
      id: 5,
      name: "Country Performance",
      description: "Country-specific performance and progress analysis",
      icon: "Globe",
      color: "from-accent to-yellow-600",
      lastGenerated: "2024-03-25",
      indicatorCount: 9,
      estimatedTime: "4 min"
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

  const handlePreviewReport = () => {
    if (activeTab === "custom" && selectedIndicators.length === 0) {
      toast.warning("Please add indicators to preview the report");
      return;
    }
    
    toast.info("Opening report preview...");
    // In real implementation, this would open a preview modal/page
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
    if (activeTab === "custom" && selectedIndicators.length === 0) {
      toast.warning("Please add indicators to your custom report");
      return;
    }

    setGenerating(true);
    
    try {
      // Create report queue entry
      const reportId = Date.now().toString();
      const reportName = filters.reportTitle || "Custom Report";
      
      dispatch(setReportQueue({
        id: reportId,
        name: reportName,
        status: "generating",
        progress: 0,
        format: filters.format,
        createdAt: new Date().toISOString()
      }));

      toast.success("Report added to generation queue");
      
      // Simulate report generation with progress updates
      for (let progress = 20; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        dispatch(updateReportProgress({ id: reportId, progress }));
      }
      
      // Complete the report
      dispatch(updateReportProgress({ 
        id: reportId, 
        status: "completed",
        downloadUrl: `/reports/${reportId}.${filters.format}`
      }));
      
      dispatch(addReportToHistory({
        id: reportId,
        name: reportName,
        type: activeTab === "custom" ? "Custom" : "Template",
        generated: new Date().toISOString().split('T')[0],
        size: "2.1 MB",
        format: filters.format.toUpperCase(),
        indicatorCount: selectedIndicators.length
      }));
      
      toast.success(`${reportName} generated and ready for download!`);
      
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
      // Create report queue entry for template
      const reportId = Date.now().toString();
      
      dispatch(setReportQueue({
        id: reportId,
        name: template.name,
        status: "generating",
        progress: 0,
        format: filters.format,
        createdAt: new Date().toISOString()
      }));

      toast.success(`${template.name} added to generation queue`);
      
      // Simulate faster template generation
      for (let progress = 25; progress <= 100; progress += 25) {
        await new Promise(resolve => setTimeout(resolve, 300));
        dispatch(updateReportProgress({ id: reportId, progress }));
      }
      
      dispatch(updateReportProgress({ 
        id: reportId, 
        status: "completed",
        downloadUrl: `/reports/templates/${reportId}.${filters.format}`
      }));
      
      dispatch(addReportToHistory({
        id: reportId,
        name: template.name,
        type: "Template",
        generated: new Date().toISOString().split('T')[0],
        size: "1.8 MB",
        format: filters.format.toUpperCase(),
        indicatorCount: template.indicatorCount
      }));
      
      toast.success(`${template.name} generated and ready for download!`);
      
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
        <div className="flex space-x-3">
          {reports?.queue?.length > 0 && (
            <Button variant="outline">
              <ApperIcon name="Clock" size={16} className="mr-2" />
              Export Queue ({reports.queue.filter(r => r.status === "generating").length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setActiveTab("history")}>
            <ApperIcon name="History" size={16} className="mr-2" />
            Report History
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ApperIcon name="Layout" size={16} className="mr-2 inline" />
          Template Library
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "custom"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ApperIcon name="Wrench" size={16} className="mr-2 inline" />
          Custom Builder
        </button>
        <button
onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ApperIcon name="Archive" size={16} className="mr-2 inline" />
          Report History
        </button>
        
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "scheduled"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ApperIcon name="Calendar" size={16} className="mr-2 inline" />
          Scheduled Reports
        </button>
      </div>

      {/* Template Library */}
      {activeTab === "templates" && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Templates</h2>
            <p className="text-gray-600">Pre-built reports with standard indicator sets and formatting</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className={`h-32 bg-gradient-to-br ${template.color} p-4 text-white relative`}>
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                      <div className="flex items-center space-x-4 text-sm opacity-90">
                        <span>{template.indicatorCount} indicators</span>
                        <span>~{template.estimatedTime}</span>
                      </div>
                    </div>
                    <ApperIcon name={template.icon} size={32} className="opacity-80" />
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Last: {template.lastGenerated}
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleTemplateGenerate(template)}
                      loading={generating}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ApperIcon name="Download" size={14} className="mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Generate Section */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Quick Generate Options</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handlePreviewReport}
                  >
                    <ApperIcon name="Eye" size={16} className="mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

{/* Custom Report Builder */}
      {activeTab === "custom" && (
        <>
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Custom Report Builder</h2>
            <p className="text-gray-600">Drag and drop indicators to create your personalized report</p>
          </div>
          
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
                                snapshot.isDragging ? 'rotate-2 shadow-lg z-50' : ''
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
          {/* Report Configuration */}
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
                    <Button variant="outline" onClick={handlePreviewReport}>
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
        </>
      )}

      {/* Export Queue */}
      {reports?.queue?.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Export Queue</h3>
          </div>
          <div className="p-4 space-y-3">
            {reports.queue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {item.status === "generating" ? (
                      <ApperIcon name="Loader" size={20} className="text-primary animate-spin" />
                    ) : (
                      <ApperIcon name="CheckCircle" size={20} className="text-success" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.status === "generating" ? `${item.progress}% complete` : "Ready for download"}
                    </div>
                  </div>
                </div>
                
                {item.status === "completed" && (
                  <Button size="sm">
                    <ApperIcon name="Download" size={14} className="mr-1" />
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report History */}
{activeTab === "history" && (
        <>
          {/* Recent Reports */}
          <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report History</h2>
            <p className="text-gray-600">Access and re-download previously generated reports</p>
          </div>
          
          <Card>
            <div className="space-y-4">
              {(reports?.history || [
                {
                  id: "1",
                  name: "Q1 2024 Board Report",
                  type: "Template",
                  generated: "2024-03-28",
                  size: "2.4 MB",
                  format: "PDF",
                  indicatorCount: 8
                },
                {
                  id: "2",
                  name: "Cambodia Country Performance",
                  type: "Template",
                  generated: "2024-03-25",
                  size: "1.8 MB", 
                  format: "EXCEL",
                  indicatorCount: 9
                },
                {
                  id: "3",
                  name: "Custom Impact Analysis",
                  type: "Custom",
                  generated: "2024-03-20",
                  size: "3.1 MB",
                  format: "PDF",
                  indicatorCount: 12
                }
              ]).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <ApperIcon name="FileText" size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-600">
                        {report.type} • {report.indicatorCount} indicators • Generated {report.generated} • {report.size}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-xs bg-success text-white px-2 py-1 rounded-full">
                      {report.format}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Download started")}>
                      <ApperIcon name="Download" size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Share link copied to clipboard")}>
                      <ApperIcon name="Share" size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!reports?.history || reports.history.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <ApperIcon name="FileText" size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-sm mt-1">Generated reports will appear here for easy access</p>
                </div>
              )}
            </div>
</Card>
</div>
        </>
      )}

      {/* Scheduled Reports Tab */}
      {activeTab === "scheduled" && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Schedule Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Scheduled Report</h3>
                  <p className="text-sm text-gray-600 mt-1">Set up automated report generation and delivery</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast.info("Import schedule feature will be available in future updates")}
                >
                  <ApperIcon name="Upload" size={16} className="mr-2" />
                  Import Schedule
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g., Monthly Progress Report"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Template <span className="text-red-500">*</span>
                    </label>
                    <Select className="w-full">
                      <option value="">Select template</option>
                      <option value="progress">Progress Report</option>
                      <option value="impact">Impact Assessment</option>
                      <option value="financial">Financial Summary</option>
                      <option value="dashboard">Dashboard Export</option>
                      <option value="custom">Custom Report</option>
                    </Select>
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Schedule Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <Select className="w-full">
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day of Week/Month
                      </label>
                      <Select className="w-full">
                        <option value="">Auto (End of period)</option>
                        <option value="1">1st</option>
                        <option value="15">15th</option>
                        <option value="last">Last day</option>
                        <option value="monday">Monday</option>
                        <option value="friday">Friday</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time (24h format)
                      </label>
                      <Input
                        type="time"
                        defaultValue="09:00"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Settings */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Delivery Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Recipients <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Enter email addresses separated by commas"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate multiple emails with commas
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Format
                        </label>
                        <Select className="w-full">
                          <option value="pdf">PDF</option>
                          <option value="excel">Excel</option>
                          <option value="both">Both PDF & Excel</option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Subject
                        </label>
                        <Input
                          placeholder="Automated Report: [Report Name] - [Date]"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Report Filters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <Select className="w-full">
                        <option value="">All Countries</option>
                        <option value="BD">Bangladesh</option>
                        <option value="PH">Philippines</option>
                        <option value="AU">Australia</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project
                      </label>
                      <Select className="w-full">
                        <option value="">All Projects</option>
                        <option value="1">Financial Inclusion Program</option>
                        <option value="2">Rural Development Initiative</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <Select className="w-full">
                        <option value="current">Current Period</option>
                        <option value="previous">Previous Period</option>
                        <option value="ytd">Year to Date</option>
                        <option value="custom">Custom Range</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 flex justify-end space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => toast.info("Schedule preview will be available in future updates")}
                  >
                    <ApperIcon name="Eye" size={16} className="mr-2" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast.info("Schedule saved as draft")}
                  >
                    <ApperIcon name="Save" size={16} className="mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    onClick={() => toast.success("Scheduled report created successfully!")}
                  >
                    <ApperIcon name="Calendar" size={16} className="mr-2" />
                    Create Schedule
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Schedule Summary & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Schedules</span>
                  <span className="text-lg font-semibold text-primary">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reports This Month</span>
                  <span className="text-lg font-semibold text-secondary">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Report</span>
                  <span className="text-sm font-medium text-gray-900">Tomorrow 9:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-lg font-semibold text-success">98.5%</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info("Template import will be available in future updates")}
                >
                  <ApperIcon name="Download" size={16} className="mr-2" />
                  Import Templates
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info("Bulk schedule creation will be available in future updates")}
                >
                  <ApperIcon name="Upload" size={16} className="mr-2" />
                  Bulk Create
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info("Schedule export will be available in future updates")}
                >
                  <ApperIcon name="FileText" size={16} className="mr-2" />
                  Export Schedules
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast.info("Delivery logs will be available in future updates")}
                >
                  <ApperIcon name="Clock" size={16} className="mr-2" />
                  View Delivery Logs
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Active Schedules List */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Schedules</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your automated report schedules</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="Search schedules..."
                    className="w-64"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Schedule filters will be available in future updates")}
                  >
                    <ApperIcon name="Filter" size={16} className="mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Monthly Progress Report</div>
                        <div className="text-sm text-gray-500">Progress Template • All Countries</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Monthly</div>
                      <div className="text-sm text-gray-500">1st @ 09:00</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Dec 1, 2024</div>
                      <div className="text-sm text-gray-500">in 5 days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">3 recipients</div>
                      <div className="text-sm text-gray-500">PDF, Excel</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ApperIcon name="CheckCircle" size={12} className="mr-1" />
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-primary hover:text-secondary"
                        onClick={() => toast.info("Edit schedule will be available in future updates")}
                      >
                        <ApperIcon name="Edit" size={16} />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => toast.info("Schedule paused")}
                      >
                        <ApperIcon name="Pause" size={16} />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-600"
                        onClick={() => toast.success("Schedule deleted successfully")}
                      >
                        <ApperIcon name="Trash" size={16} />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Weekly Dashboard Export</div>
                        <div className="text-sm text-gray-500">Dashboard Template • Bangladesh</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Weekly</div>
                      <div className="text-sm text-gray-500">Friday @ 17:00</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Nov 29, 2024</div>
                      <div className="text-sm text-gray-500">Tomorrow</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">5 recipients</div>
                      <div className="text-sm text-gray-500">PDF</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <ApperIcon name="CheckCircle" size={12} className="mr-1" />
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-primary hover:text-secondary"
                        onClick={() => toast.info("Edit schedule will be available in future updates")}
                      >
                        <ApperIcon name="Edit" size={16} />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => toast.info("Schedule paused")}
                      >
                        <ApperIcon name="Pause" size={16} />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-600"
                        onClick={() => toast.success("Schedule deleted successfully")}
                      >
                        <ApperIcon name="Trash" size={16} />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Quarterly Impact Assessment</div>
                        <div className="text-sm text-gray-500">Impact Template • All Projects</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Quarterly</div>
                      <div className="text-sm text-gray-500">Last day @ 12:00</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Dec 31, 2024</div>
                      <div className="text-sm text-gray-500">in 1 month</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">8 recipients</div>
                      <div className="text-sm text-gray-500">PDF, Excel</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ApperIcon name="Pause" size={12} className="mr-1" />
                        Paused
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-primary hover:text-secondary"
                        onClick={() => toast.info("Edit schedule will be available in future updates")}
                      >
                        <ApperIcon name="Edit" size={16} />
                      </button>
                      <button 
                        className="text-green-400 hover:text-green-600"
                        onClick={() => toast.success("Schedule resumed")}
                      >
                        <ApperIcon name="Play" size={16} />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-600"
                        onClick={() => toast.success("Schedule deleted successfully")}
                      >
                        <ApperIcon name="Trash" size={16} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing 3 of 3 schedules
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Bulk actions will be available in future updates")}
                  >
                    <ApperIcon name="Settings" size={16} className="mr-2" />
                    Bulk Actions
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast.info("Run all schedules will be available in future updates")}
                  >
                    <ApperIcon name="Play" size={16} className="mr-2" />
                    Run All
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        </>
      )}
    </div>
  );
};

export default Reports;