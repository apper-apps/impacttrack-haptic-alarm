import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { countryService } from '@/services/api/countryService';
import { projectService } from '@/services/api/projectService';
import { dataPointService } from '@/services/api/dataPointService';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import SearchBar from '@/components/molecules/SearchBar';
import StatsCard from '@/components/molecules/StatsCard';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Badge from '@/components/atoms/Badge';

function Countries() {
  const navigate = useNavigate();
  const { selectedCountry } = useSelector(state => state.mel);
  
  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [countriesData, projectsData, dataPointsData] = await Promise.all([
        countryService.getAll(),
        projectService.getAll(),
        dataPointService.getAll()
      ]);

      setCountries(countriesData);
      setProjects(projectsData);
      setDataPoints(dataPointsData);
      
      toast.success('Countries data loaded successfully');
    } catch (err) {
      console.error('Error loading countries data:', err);
      setError('Failed to load countries data. Please try again.');
      toast.error('Failed to load countries data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCountryPerformance = (country) => {
    const countryProjects = projects.filter(p => p.countryId === country.Id && p.status === 'active');
    const projectIds = countryProjects.map(p => p.Id);
    
    // Current quarter participation (indicator 1 - People Trained)
    const currentParticipation = dataPoints
      .filter(dp => 
        projectIds.includes(dp.projectId) && 
        dp.indicatorId === 1 && 
        dp.status === 'approved' && 
        dp.period === '2024-Q1'
      )
      .reduce((sum, dp) => sum + dp.value, 0);

    // Female participation (indicator 2)
    const femaleParticipation = dataPoints
      .filter(dp => 
        projectIds.includes(dp.projectId) && 
        dp.indicatorId === 2 && 
        dp.status === 'approved' && 
        dp.period === '2024-Q1'
      )
      .reduce((sum, dp) => sum + dp.value, 0);

    const femalePercentage = currentParticipation > 0 ? 
      Math.round((femaleParticipation / currentParticipation) * 100) : 
      country.femaleParticipation || 0;

    // Target achievement calculation
    const target = country.totalReach * 0.25; // Q1 target is 25% of annual
    const achievementRate = target > 0 ? (currentParticipation / target) * 100 : 0;

    // Status determination
    let status = 'On Track';
    let statusColor = 'success';
    
    if (achievementRate < 70) {
      status = 'Critical';
      statusColor = 'error';
    } else if (achievementRate < 90) {
      status = 'Needs Attention';
      statusColor = 'warning';
    }

    // Last update from most recent data point
    const recentDataPoint = dataPoints
      .filter(dp => projectIds.includes(dp.projectId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    const lastUpdate = recentDataPoint ? 
      new Date(recentDataPoint.createdAt).toLocaleDateString() : 
      'No recent updates';

    return {
      ...country,
      currentParticipation,
      femalePercentage,
      projectCount: countryProjects.length,
      status,
      statusColor,
      achievementRate: Math.round(achievementRate),
      lastUpdate,
      target: Math.round(target)
    };
  };

  const filteredCountries = countries
    .map(calculateCountryPerformance)
    .filter(country => {
      const matchesSearch = country.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || country.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.currentParticipation - a.currentParticipation);

  const handleCountryClick = (country) => {
    navigate(`/countries/${country.Id}`, { state: { country } });
    toast.info(`Viewing ${country.name} details`);
  };

  const aggregateStats = filteredCountries.reduce((acc, country) => {
    acc.totalParticipants += country.currentParticipation;
    acc.totalProjects += country.projectCount;
    acc.avgFemaleParticipation += country.femalePercentage;
    if (country.status === 'On Track') acc.onTrackCount++;
    if (country.status === 'Needs Attention') acc.needsAttentionCount++;
    if (country.status === 'Critical') acc.criticalCount++;
    return acc;
  }, {
    totalParticipants: 0,
    totalProjects: 0,
    avgFemaleParticipation: 0,
    onTrackCount: 0,
    needsAttentionCount: 0,
    criticalCount: 0
  });

  if (filteredCountries.length > 0) {
    aggregateStats.avgFemaleParticipation = Math.round(
      aggregateStats.avgFemaleParticipation / filteredCountries.length
    );
  }

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadData} />;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-primary-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ApperIcon name="Globe" size={32} className="text-primary" />
            Countries Performance
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor training delivery and impact across all program countries
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ApperIcon name="RefreshCw" size={16} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Participants"
          value={aggregateStats.totalParticipants.toLocaleString()}
          icon="Users"
          trend="up"
          change="+12%"
        />
        <StatsCard
          title="Active Projects"
          value={aggregateStats.totalProjects}
          icon="FolderOpen"
          trend="up"
          change="+8%"
        />
        <StatsCard
          title="Avg Female Participation"
          value={`${aggregateStats.avgFemaleParticipation}%`}
          icon="UserCheck"
          trend="up"
          change="+2%"
        />
        <StatsCard
          title="Countries On Track"
          value={`${aggregateStats.onTrackCount}/${filteredCountries.length}`}
          icon="TrendingUp"
          trend={aggregateStats.onTrackCount > aggregateStats.criticalCount ? "up" : "down"}
          change={`${Math.round((aggregateStats.onTrackCount / filteredCountries.length) * 100)}%`}
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex-1">
          <SearchBar
            placeholder="Search countries..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <option value="All">All Status</option>
            <option value="On Track">On Track</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Critical">Critical</option>
          </Select>
        </div>
      </div>

      {/* Status Summary */}
      {aggregateStats.needsAttentionCount > 0 || aggregateStats.criticalCount > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="AlertTriangle" size={20} className="text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Performance Alerts</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{aggregateStats.onTrackCount} On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>{aggregateStats.needsAttentionCount} Need Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>{aggregateStats.criticalCount} Critical</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {filteredCountries.map((country) => (
          <Card
            key={country.Id}
            className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
            style={{
              borderLeftColor: 
                country.statusColor === 'success' ? '#28a745' :
                country.statusColor === 'warning' ? '#fbbf24' : '#dc2626'
            }}
            onClick={() => handleCountryClick(country)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {country.code}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {country.name}
                  </h3>
                  <Badge variant={country.statusColor} className="text-xs">
                    {country.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {country.achievementRate}%
                </div>
                <div className="text-xs text-gray-500">Target Achievement</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">
                  {country.currentParticipation.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Total Participants</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">
                  {country.femalePercentage}%
                </div>
                <div className="text-xs text-gray-600">Female %</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <ApperIcon name="FolderOpen" size={14} />
                <span>{country.projectCount} Projects</span>
              </div>
              <div className="flex items-center gap-1">
                <ApperIcon name="Clock" size={14} />
                <span>{country.lastUpdate}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Target: {country.target.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-primary">
                  <span className="text-sm font-medium">View Details</span>
                  <ApperIcon name="ChevronRight" size={16} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-12">
          <ApperIcon name="Search" size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default Countries;