import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { countryService } from '@/services/api/countryService';
import { projectService } from '@/services/api/projectService';
import { dataPointService } from '@/services/api/dataPointService';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import StatsCard from '@/components/molecules/StatsCard';
import ChartCard from '@/components/molecules/ChartCard';
import DataTable from '@/components/molecules/DataTable';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

function CountryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [country, setCountry] = useState(location.state?.country || null);
  const [projects, setProjects] = useState([]);
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(!country);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCountryData();
  }, [id]);

  const loadCountryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [countryData, projectsData, dataPointsData] = await Promise.all([
        country ? Promise.resolve(country) : countryService.getById(id),
        projectService.getByCountry(id),
        dataPointService.getAll()
      ]);

      setCountry(countryData);
      setProjects(projectsData);
      setDataPoints(dataPointsData);
      
      toast.success(`${countryData.name} details loaded successfully`);
    } catch (err) {
      console.error('Error loading country details:', err);
      setError('Failed to load country details. Please try again.');
      toast.error('Failed to load country details');
    } finally {
      setLoading(false);
    }
  };

  const calculateHistoricalData = () => {
    const periods = ['2023-Q2', '2023-Q3', '2023-Q4', '2024-Q1'];
    const projectIds = projects.map(p => p.Id);
    
    return periods.map(period => {
      const periodData = dataPoints.filter(dp =>
        projectIds.includes(dp.projectId) &&
        dp.indicatorId === 1 &&
        dp.status === 'approved' &&
        dp.period === period
      );
      
      return {
        period,
        participants: periodData.reduce((sum, dp) => sum + dp.value, 0)
      };
    });
  };

  const projectColumns = [
    { key: 'name', label: 'Project Name', sortable: true },
    { key: 'status', label: 'Status', render: (value) => <Badge variant={value === 'active' ? 'success' : 'warning'}>{value}</Badge> },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
    { key: 'budget', label: 'Budget', render: (value) => `$${value.toLocaleString()}` }
  ];

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadCountryData} />;
  if (!country) return <Error message="Country not found" onRetry={() => navigate('/countries')} />;

  const historicalData = calculateHistoricalData();
  const currentParticipants = historicalData[historicalData.length - 1]?.participants || 0;
  const femaleParticipants = Math.round(currentParticipants * (country.femaleParticipation / 100));

  const chartData = [{
    name: 'Participants Trained',
    data: historicalData.map(d => d.participants)
  }];

  const chartOptions = {
    chart: { type: 'line', toolbar: { show: true } },
    xaxis: { categories: historicalData.map(d => d.period) },
    yaxis: { title: { text: 'Number of Participants' } },
    colors: ['#667eea'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 6 },
    tooltip: {
      y: { formatter: (val) => `${val.toLocaleString()} people` }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-primary-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/countries')}
            className="flex items-center gap-2"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            Back to Countries
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
              <span className="font-bold text-gray-600">{country.code}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{country.name}</h1>
              <p className="text-gray-600">Population: {country.population?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={loadCountryData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ApperIcon name="RefreshCw" size={16} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Participants"
          value={currentParticipants.toLocaleString()}
          icon="Users"
          trend="up"
          change="+15%"
        />
        <StatsCard
          title="Female Participants"
          value={`${femaleParticipants.toLocaleString()} (${country.femaleParticipation}%)`}
          icon="UserCheck"
          trend="up"
          change="+3%"
        />
        <StatsCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'active').length}
          icon="FolderOpen"
          trend="stable"
          change="0%"
        />
        <StatsCard
          title="Total Reach"
          value={country.totalReach?.toLocaleString() || 'N/A'}
          icon="Target"
          trend="up"
          change="+8%"
        />
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Training Delivery Trend"
          subtitle="Quarterly participant numbers"
          chartData={chartData}
          chartOptions={chartOptions}
          type="line"
          height={300}
        />
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ApperIcon name="Info" size={20} />
            Country Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <Badge variant={country.status === 'active' ? 'success' : 'warning'}>
                {country.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Population</span>
              <span className="font-semibold">{country.population?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Female Participation Rate</span>
              <span className="font-semibold">{country.femaleParticipation}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Total Historical Reach</span>
              <span className="font-semibold">{country.totalReach?.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ApperIcon name="FolderOpen" size={20} />
            Active Projects ({projects.length})
          </h3>
          <Button
            variant="outline"
            onClick={() => navigate('/projects', { state: { countryFilter: country.Id } })}
            className="flex items-center gap-2"
          >
            <ApperIcon name="ExternalLink" size={16} />
            View All Projects
          </Button>
        </div>
        <DataTable
          data={projects}
          columns={projectColumns}
          searchable={true}
          sortable={true}
          onRowClick={(project) => navigate(`/projects/${project.Id}`)}
        />
      </Card>
    </div>
  );
}

export default CountryDetail;