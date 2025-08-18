import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import SearchBar from "@/components/molecules/SearchBar";
import DataTable from "@/components/molecules/DataTable";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { projectService } from "@/services/api/projectService";
import { countryService } from "@/services/api/countryService";

const Projects = () => {
  const { selectedCountry } = useSelector((state) => state.mel);
  
  const [projects, setProjects] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    
    return {
      ...project,
      countryName: country?.name || "Unknown",
      countryCode: country?.code || "XX",
      progressPercentage,
      progressStatus: progressPercentage >= 100 ? "completed" : progressPercentage >= 75 ? "on-track" : "behind"
    };
  });

  // Filter projects based on search
  const filteredProjects = enhancedProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      label: "Project Name",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600 truncate max-w-xs">{row.description}</div>
        </div>
      )
    },
    {
      key: "countryName",
      label: "Country",
      render: (value, row) => (
        <div className="flex items-center">
          <div className="w-6 h-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded mr-2 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{row.countryCode}</span>
          </div>
          {value}
        </div>
      )
    },
    {
      key: "currentReach",
      label: "People Reached",
      type: "number",
      render: (value, row) => (
        <div>
          <div className="font-medium">{value.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Target: {row.targetReach.toLocaleString()}</div>
        </div>
      )
    },
    {
      key: "progressPercentage",
      label: "Progress",
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-1 mr-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  row.progressStatus === "completed" ? "bg-success" :
                  row.progressStatus === "on-track" ? "bg-info" : "bg-warning"
                }`}
                style={{ width: `${Math.min(value, 100)}%` }}
              ></div>
            </div>
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )
    },
    {
      key: "budget",
      label: "Budget",
      type: "currency"
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
    }
  ];

  const handleRowClick = (project) => {
    toast.info(`Opening project: ${project.name}`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            {selectedCountry ? `Projects in ${selectedCountry}` : "All projects across countries"}
          </p>
        </div>
        <Button>
          <ApperIcon name="Plus" size={16} className="mr-2" />
          New Project
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="FolderOpen" size={20} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredProjects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
          </div>
        </Card>

        <Card padding="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-success to-green-600 rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="CheckCircle" size={20} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProjects.filter(p => p.status === "active").length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </div>
        </Card>

        <Card padding="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-info to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="Users" size={20} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredProjects.reduce((sum, p) => sum + p.currentReach, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">People Reached</div>
            </div>
          </div>
        </Card>

        <Card padding="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-accent to-yellow-600 rounded-lg flex items-center justify-center mr-3">
              <ApperIcon name="DollarSign" size={20} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${(filteredProjects.reduce((sum, p) => sum + p.budget, 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Total Budget</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search projects by name, country, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <ApperIcon name="Filter" size={16} className="mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <ApperIcon name="Download" size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <Empty
          title="No projects found"
          message={searchTerm ? "Try adjusting your search criteria." : "No projects available for the selected filters."}
          icon="FolderOpen"
          action={() => setSearchTerm("")}
          actionLabel="Clear Search"
        />
      ) : (
        <DataTable
          data={filteredProjects}
          columns={columns}
          onRowClick={handleRowClick}
          emptyMessage="No projects match your search criteria"
        />
      )}
    </div>
  );
};

export default Projects;