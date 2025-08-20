import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { projectService } from "@/services/api/projectService";
import { dataPointService } from "@/services/api/dataPointService";
import { countryService } from "@/services/api/countryService";
import ApperIcon from "@/components/ApperIcon";
import Projects from "@/components/pages/Projects";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import DataTable from "@/components/molecules/DataTable";
import ChartCard from "@/components/molecules/ChartCard";
import StatsCard from "@/components/molecules/StatsCard";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadProjectData();
  }, [id]);

  async function loadProjectData() {
    try {
      setLoading(true);
      setError(null);
      
      const [projectData, dataPointsData, countriesData] = await Promise.all([
        projectService.getById(parseInt(id)),
        dataPointService.getByProjectId(parseInt(id)),
        countryService.getAll()
      ]);
      
      setProject(projectData);
      setDataPoints(dataPointsData);
      setCountries(countriesData);
      setEditData(projectData);
    } catch (err) {
      console.error('Error loading project data:', err);
      setError('Failed to load project data');
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    const colors = {
      'active': 'bg-success text-white',
      'completed': 'bg-info text-white',
      'on-hold': 'bg-warning text-white',
      'cancelled': 'bg-error text-white',
      'planning': 'bg-secondary text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  }

  function getPriorityColor(priority) {
    const colors = {
      'high': 'bg-error text-white',
      'medium': 'bg-warning text-white',
      'low': 'bg-success text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function calculateProgress() {
    if (!project || !dataPoints.length) return 0;
    const completedDataPoints = dataPoints.filter(dp => dp.status === 'approved').length;
    return Math.round((completedDataPoints / dataPoints.length) * 100);
  }

  function calculateBudgetUtilization() {
    if (!project) return 0;
    return Math.round((project.spentBudget / project.totalBudget) * 100);
  }

  async function handleSaveChanges() {
    try {
      await projectService.update(parseInt(id), editData);
      setProject({ ...project, ...editData });
      setEditMode(false);
      toast.success('Project updated successfully');
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Failed to update project');
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      await projectService.delete(parseInt(id));
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Failed to delete project');
    }
  }

  const activityColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (item) => formatDate(item.date)
    },
    {
      key: 'activity',
      label: 'Activity',
      render: (item) => item.activity
    },
    {
      key: 'user',
      label: 'User',
      render: (item) => item.user
    },
    {
      key: 'type',
      label: 'Type',
      render: (item) => (
        <Badge className={`${item.type === 'update' ? 'bg-info' : item.type === 'create' ? 'bg-success' : 'bg-warning'} text-white`}>
          {item.type}
        </Badge>
      )
    }
  ];

  const dataPointColumns = [
    {
      key: 'indicator',
      label: 'Indicator',
      render: (item) => item.indicatorName
    },
    {
      key: 'value',
      label: 'Value',
      render: (item) => item.value?.toLocaleString() || 'N/A'
    },
    {
      key: 'period',
      label: 'Period',
      render: (item) => item.period
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge className={`${item.status === 'approved' ? 'bg-success' : item.status === 'pending' ? 'bg-warning' : 'bg-error'} text-white`}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (item) => formatDate(item.lastUpdated)
    }
  ];

  const teamColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (item) => item.name
    },
    {
      key: 'role',
      label: 'Role',
      render: (item) => item.role
    },
    {
      key: 'email',
      label: 'Email',
      render: (item) => item.email
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge className={`${item.status === 'active' ? 'bg-success' : 'bg-gray-500'} text-white`}>
          {item.status}
        </Badge>
      )
    }
  ];

  const mockActivities = [
    { id: 1, date: '2024-01-15', activity: 'Data point submitted for Q1 indicators', user: 'John Smith', type: 'create' },
    { id: 2, date: '2024-01-14', activity: 'Project budget updated', user: 'Sarah Johnson', type: 'update' },
    { id: 3, date: '2024-01-13', activity: 'New team member added', user: 'Mike Wilson', type: 'create' },
    { id: 4, date: '2024-01-12', activity: 'Status changed to Active', user: 'Admin', type: 'update' }
  ];

  const mockTeamMembers = [
    { id: 1, name: 'John Smith', role: 'Project Manager', email: 'john.smith@org.com', status: 'active' },
    { id: 2, name: 'Sarah Johnson', role: 'Data Analyst', email: 'sarah.johnson@org.com', status: 'active' },
    { id: 3, name: 'Mike Wilson', role: 'Field Coordinator', email: 'mike.wilson@org.com', status: 'active' },
    { id: 4, name: 'Lisa Chen', role: 'M&E Specialist', email: 'lisa.chen@org.com', status: 'inactive' }
  ];

  const chartData = {
    series: [{
      name: 'Progress',
      data: [65, 78, 82, 85, 88, 90]
    }],
    options: {
      chart: { type: 'line', height: 300 },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      },
      colors: ['#667eea'],
      stroke: { width: 3 },
      markers: { size: 6 }
    }
  };
// Ensure budget chart data is valid before rendering
  const budgetChartData = project && project.totalBudget ? {
    series: [
      Number(project.spentBudget) || 0, 
      Math.max(0, (Number(project.totalBudget) || 0) - (Number(project.spentBudget) || 0))
    ],
    options: {
      chart: { type: 'donut', height: 300 },
      labels: ['Spent', 'Remaining'],
      colors: ['#667eea', '#e5e7eb'],
      legend: { position: 'bottom' }
    }
  } : null;
  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadProjectData} />;
  }

  if (!project) {
    return <Error message="Project not found" onRetry={() => navigate('/projects')} />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button
          onClick={() => navigate('/projects')}
          className="hover:text-primary transition-colors"
        >
          Projects
        </button>
        <ApperIcon name="ChevronRight" size={14} />
        <span className="font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority} priority
            </Badge>
          </div>
          <p className="text-gray-600 max-w-2xl">{project.description}</p>
        </div>

        <div className="flex items-center space-x-3">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setEditData(project);
                }}
              >
                <ApperIcon name="X" size={16} />
                Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                <ApperIcon name="Check" size={16} />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                <ApperIcon name="Edit" size={16} />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteProject}
                className="text-error border-error hover:bg-error hover:text-white"
              >
                <ApperIcon name="Trash2" size={16} />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Progress"
          value={`${calculateProgress()}%`}
          change={12}
          icon="TrendingUp"
          color="success"
        />
        <StatsCard
          title="Total Budget"
          value={formatCurrency(project.totalBudget)}
          icon="DollarSign"
          color="info"
        />
        <StatsCard
          title="Budget Used"
          value={`${calculateBudgetUtilization()}%`}
          change={-5}
          icon="PieChart"
          color="warning"
        />
        <StatsCard
          title="Data Points"
          value={dataPoints.length.toString()}
          change={8}
          icon="BarChart3"
          color="primary"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: 'Home' },
            { id: 'data', label: 'Data Points', icon: 'BarChart3' },
            { id: 'team', label: 'Team', icon: 'Users' },
            { id: 'activity', label: 'Activity', icon: 'Activity' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ApperIcon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      options={[
                        { value: 'planning', label: 'Planning' },
                        { value: 'active', label: 'Active' },
                        { value: 'on-hold', label: 'On Hold' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <Select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' }
                      ]}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Start Date:</span>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">End Date:</span>
                    <span>{formatDate(project.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Country:</span>
                    <span>{countries.find(c => c.Id === project.countryId)?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Budget:</span>
                    <span>{formatCurrency(project.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Spent Budget:</span>
                    <span>{formatCurrency(project.spentBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Manager:</span>
                    <span>{project.manager}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Charts */}
          <div className="space-y-6">
            <ChartCard
              title="Project Progress Over Time"
              subtitle="Monthly progress tracking"
              type="line"
              data={chartData}
            />
{budgetChartData ? (
              <ChartCard
                title="Budget Utilization"
                subtitle="Spent vs Remaining Budget"
                type="donut"
                data={budgetChartData}
              />
            ) : (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Budget Utilization</h3>
<p className="text-gray-500">Budget data not available</p>
              </Card>
            )}
          </div>
        </div>
      )}
      {activeTab === 'data' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Data Points</h3>
            <Button onClick={() => navigate(`/data-entry?projectId=${id}`)}>
              <ApperIcon name="Plus" size={16} />
              Add Data Point
            </Button>
          </div>
          <DataTable
            columns={dataPointColumns}
            data={dataPoints}
            searchable={true}
            sortable={true}
            onRowClick={(dataPoint) => toast.info(`Viewing data point: ${dataPoint.indicatorName}`)}
          />
        </Card>
      )}

      {activeTab === 'team' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button onClick={() => toast.info('Add team member functionality would open here')}>
              <ApperIcon name="UserPlus" size={16} />
              Add Member
            </Button>
          </div>
          <DataTable
            columns={teamColumns}
            data={mockTeamMembers}
            searchable={true}
            sortable={true}
            onRowClick={(member) => toast.info(`Viewing team member: ${member.name}`)}
          />
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <DataTable
            columns={activityColumns}
            data={mockActivities}
            searchable={true}
            sortable={true}
            pagination={true}
          />
        </Card>
      )}
    </div>
  );
}

export default ProjectDetail;