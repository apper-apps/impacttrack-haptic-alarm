import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { projectService } from "@/services/api/projectService";
import { countryService } from "@/services/api/countryService";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import SearchBar from "@/components/molecules/SearchBar";
import StatsCard from "@/components/molecules/StatsCard";
import DataTable from "@/components/molecules/DataTable";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import Select from "@/components/atoms/Select";
const Projects = () => {
  const { selectedCountry } = useSelector((state) => state.mel);
  
const [projects, setProjects] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [projectsData, countriesData] = await Promise.all([
        projectService.getAll(),
        countryService.getAll()
      ]);

      let filteredProjects = projectsData;
      
      // Filter by selected country if applicable
      if (selectedCountry) {
        const country = countriesData.find(c => c.code.toLowerCase() === selectedCountry.toLowerCase());
        if (country) {
          filteredProjects = projectsData.filter(p => p.countryId === country.Id);
        }
      }

      setProjects(filteredProjects);
      setCountries(countriesData);
    } catch (err) {
      setError(err.message);
      console.error("Projects loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCountry]);

  // Enhanced projects data with country information
const enhancedProjects = projects.map(project => {
    const country = countries.find(c => c.Id === project.countryId);
    const progressPercentage = Math.round((project.currentReach / project.targetReach) * 100);
    
    // Calculate timeline progress
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    const timelineProgress = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
    
    // Determine project health status
    let healthStatus = "on-track"; // Green
    if (project.status === "inactive" || project.status === "cancelled") {
      healthStatus = "inactive"; // Grey
    } else if (project.riskLevel === "high" || progressPercentage < timelineProgress - 20) {
      healthStatus = "critical"; // Red
    } else if (project.riskLevel === "medium" || progressPercentage < timelineProgress - 10) {
      healthStatus = "attention"; // Yellow
    }
    
    return {
      ...project,
      countryName: country?.name || "Unknown",
      countryCode: country?.code || "XX",
      progressPercentage,
      timelineProgress,
      healthStatus,
      progressStatus: progressPercentage >= 100 ? "completed" : progressPercentage >= 75 ? "on-track" : "behind"
    };
  });

  // Apply all filters
const filteredProjects = enhancedProjects.filter(project => {
    const matchesSearch = project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project?.countryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || project?.status === statusFilter;
    const matchesRisk = !riskFilter || project?.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Calculate summary statistics
  const totalProjects = filteredProjects.length;
  const avgAchievementRate = totalProjects > 0 ? 
    filteredProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / totalProjects : 0;
  
  const statusDistribution = {
    active: filteredProjects.filter(p => p.status === "active").length,
    completed: filteredProjects.filter(p => p.status === "completed").length,
    paused: filteredProjects.filter(p => p.status === "paused").length,
    inactive: filteredProjects.filter(p => p.status === "inactive").length
  };

const columns = [
    {
      key: "select",
      label: "",
      sortable: false,
render: (value, row) => {
        if (!row || !row.Id) return null;
        
        return (
          <input
            type="checkbox"
            checked={selectedProjects.includes(row.Id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedProjects([...selectedProjects, row.Id]);
              } else {
                setSelectedProjects(selectedProjects.filter(id => id !== row.Id));
              }
            }}
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
          />
);
      }
    },
    {
      key: "healthStatus",
      label: "Health",
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            value === "on-track" ? "bg-success" :
            value === "attention" ? "bg-warning" :
            value === "critical" ? "bg-error" : "bg-gray-400"
          }`}></div>
          <span className="text-sm capitalize">
            {value === "on-track" ? "On Track" : 
             value === "attention" ? "Attention" :
             value === "critical" ? "Critical" : "Inactive"}
          </span>
        </div>
      )
    },
    {
      key: "name",
      label: "Project Name",
render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'Unnamed Project'}</div>
          <div className="text-sm text-gray-600 truncate max-w-xs">{row?.description || 'No description'}</div>
        </div>
      )
    },
    {
      key: "countryName",
      label: "Country",
render: (value, row) => (
        <div className="flex items-center">
          <div className="w-6 h-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded mr-2 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{row?.countryCode || 'XX'}</span>
          </div>
          {value || 'Unknown'}
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const variant = value === "active" ? "success" : 
                        value === "completed" ? "info" : 
                        value === "paused" ? "warning" : "default";
        return <Badge variant={variant}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
      }
    },
    {
      key: "currentReach",
      label: "Participants",
      type: "number",
render: (value, row) => (
        <div>
          <div className="font-medium">{(value || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-600">Target: {(row?.targetReach || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {row?.progressPercentage || 0}% achieved
          </div>
        </div>
      )
    },
    {
      key: "timelineProgress",
      label: "Timeline Progress",
render: (value, row) => (
        <div className="w-24">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{value || 0}%</span>
            <span>{row?.progressPercentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div
              className="absolute top-0 left-0 h-2 bg-gray-300 rounded-full"
              style={{ width: `${Math.min(value || 0, 100)}%` }}
            ></div>
            <div
              className={`absolute top-0 left-0 h-2 rounded-full ${
                (row?.progressPercentage || 0) >= (value || 0) ? "bg-success" : "bg-warning"
              }`}
              style={{ width: `${Math.min(row?.progressPercentage || 0, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Time vs Progress
          </div>
        </div>
      )
    },
    {
      key: "riskLevel",
      label: "Risk Level",
      render: (value) => {
        const variant = value === "low" ? "success" : 
                        value === "medium" ? "warning" : "error";
        return <Badge variant={variant}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
      }
    },
    {
      key: "budget",
      label: "Budget",
      type: "currency",
      render: (value) => `$${(value / 1000000).toFixed(1)}M`
    }
  ];

const handleRowClick = (project) => {
    toast.info(`Opening detailed view for: ${project.name}`);
    // Here you would navigate to project details page
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedProjects.length === 0) {
      toast.warning("Please select projects to update");
      return;
    }

    setBulkLoading(true);
    try {
      await projectService.bulkUpdateStatus(selectedProjects, newStatus);
      await loadData(); // Reload data
      setSelectedProjects([]);
      toast.success(`Updated ${selectedProjects.length} projects to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update projects");
    } finally {
      setBulkLoading(false);
    }
  };

const handleExport = async () => {
    try {
      const projectIds = filteredProjects?.filter(p => p?.Id).map(p => p.Id) || [];
      const exportData = await projectService.exportProjects(projectIds);
      toast.success("Project data exported successfully");
    } catch (error) {
      toast.error("Failed to export project data");
    }
  };

const handleSelectAll = (checked) => {
    if (checked) {
      const validProjectIds = filteredProjects?.filter(p => p?.Id).map(p => p.Id) || [];
      setSelectedProjects(validProjectIds);
    } else {
      setSelectedProjects([]);
    }
  };

  if (loading) {
    return <Loading variant="skeleton" />;
  }

  if (error) {
    return (
      <Error 
        message={error} 
        onRetry={loadData}
        title="Failed to load projects"
      />
    );
  }

  return (
<div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive project tracking and management dashboard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedProjects.length > 0 && (
            <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg">
              <span className="text-sm text-primary font-medium">
                {selectedProjects.length} selected
              </span>
              <Select
                value=""
                onChange={(value) => handleBulkStatusUpdate(value)}
                className="text-sm"
                disabled={bulkLoading}
              >
                <option value="" disabled>Bulk Update Status</option>
                <option value="active">Set Active</option>
                <option value="paused">Set Paused</option>
                <option value="completed">Set Completed</option>
                <option value="inactive">Set Inactive</option>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={handleExport}>
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export Data
          </Button>
          <Button>
            <ApperIcon name="Plus" size={16} className="mr-2" />
            New Project
          </Button>
</div>
      </div>

      {/* Summary Cards */}
{/* Enhanced Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          icon="FolderOpen"
          gradient="from-primary to-secondary"
        />
        
        <StatsCard
          title="Average Achievement"
          value={`${avgAchievementRate.toFixed(1)}%`}
          icon="Target"
          gradient="from-success to-green-600"
        />
        
        <StatsCard
          title="People Reached"
          value={filteredProjects.reduce((sum, p) => sum + p.currentReach, 0).toLocaleString()}
          icon="Users"
          gradient="from-info to-blue-600"
        />
        
        <StatsCard
          title="Total Budget"
          value={`$${(filteredProjects.reduce((sum, p) => sum + p.budget, 0) / 1000000).toFixed(1)}M`}
          icon="DollarSign"
          gradient="from-accent to-yellow-600"
        />
        
        <Card padding="p-4">
          <div className="text-sm text-gray-600 mb-2">Status Distribution</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                Active
              </span>
              <span className="font-medium">{statusDistribution.active}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-info rounded-full mr-1"></div>
                Completed
              </span>
              <span className="font-medium">{statusDistribution.completed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-warning rounded-full mr-1"></div>
                Paused
              </span>
              <span className="font-medium">{statusDistribution.paused}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                Inactive
              </span>
              <span className="font-medium">{statusDistribution.inactive}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
{/* Advanced Search and Filter Controls */}
      <Card padding="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search projects by name, country, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </Select>
            
            <Select
              value={riskFilter}
              onChange={setRiskFilter}
              className="min-w-[140px]"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setRiskFilter("");
                setSelectedProjects([]);
              }}
            >
              <ApperIcon name="X" size={16} className="mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
        
        {(searchTerm || statusFilter || riskFilter) && (
          <div className="flex items-center mt-3 pt-3 border-t border-gray-200">
            <ApperIcon name="Info" size={16} className="text-primary mr-2" />
            <span className="text-sm text-gray-600">
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
          </div>
        )}
      </Card>

{/* Enhanced Projects Table */}
      {filteredProjects.length === 0 ? (
        <Empty
          title="No projects found"
          message={searchTerm || statusFilter || riskFilter ? 
            "Try adjusting your search and filter criteria." : 
            "No projects available. Create your first project to get started."}
          icon="FolderOpen"
          action={() => {
            setSearchTerm("");
            setStatusFilter("");
            setRiskFilter("");
          }}
          actionLabel="Clear All Filters"
        />
      ) : (
        <Card padding="p-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Select All ({filteredProjects.length})
                  </span>
                </div>
                {selectedProjects.length > 0 && (
                  <span className="text-sm text-primary font-medium">
                    {selectedProjects.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ApperIcon name="BarChart3" size={16} />
                <span>Drill-down enabled - Click row for details</span>
              </div>
            </div>
          </div>
          <DataTable
            data={filteredProjects}
            columns={columns}
            onRowClick={handleRowClick}
            emptyMessage="No projects match your criteria"
            loading={loading}
          />
        </Card>
      )}
    </div>
  );
};

export default Projects;