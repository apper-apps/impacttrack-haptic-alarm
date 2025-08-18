import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";

const Reports = () => {
  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Report filters
  const [filters, setFilters] = useState({
    reportType: "quarterly",
    country: "",
    project: "",
    period: "2024-Q1",
    format: "pdf"
  });

  const reportTypes = [
    { value: "quarterly", label: "Quarterly Report" },
    { value: "annual", label: "Annual Impact Report" },
    { value: "donor", label: "Donor Report" },
    { value: "country", label: "Country Performance" },
    { value: "project", label: "Project Summary" },
    { value: "custom", label: "Custom Report" }
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
        const [countriesData, projectsData] = await Promise.all([
          countryService.getAll(),
          projectService.getAll()
        ]);
        setCountries(countriesData.filter(c => c.status === "active"));
        setProjects(projectsData.filter(p => p.status === "active"));
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

  const handleGenerateReport = async () => {
    setGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportName = reportTypes.find(rt => rt.value === filters.reportType)?.label || "Report";
      toast.success(`${reportName} generated successfully!`);
      
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

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

      {/* Custom Report Builder */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Report Builder</h2>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Select
              label="Report Type"
              value={filters.reportType}
              onChange={(e) => handleFilterChange("reportType", e.target.value)}
              options={reportTypes}
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
              Report will include data from {filters.period} 
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
              >
                <ApperIcon name="Download" size={16} className="mr-2" />
                Generate Report
              </Button>
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