import React from "react";
import { useSelector } from "react-redux";
import { useDashboardData } from "@/hooks/useDashboardData";
import StatsCard from "@/components/molecules/StatsCard";
import ChartCard from "@/components/molecules/ChartCard";
import ProgressRing from "@/components/molecules/ProgressRing";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const DashboardGrid = () => {
  const { selectedCountry } = useSelector((state) => state.mel);
  const { data, metrics, loading, error, refetch } = useDashboardData(selectedCountry);

  if (loading) {
    return <Loading variant="skeleton" />;
  }

  if (error) {
    return (
      <Error 
        message={error} 
        onRetry={refetch}
        title="Failed to load dashboard data"
      />
    );
  }

  // Chart data for quarterly trends
// Predictive analytics chart data
  const historicalValues = metrics.historicalQuarterly || [11800, 13100, 14200, 12500];
  const projectedValues = metrics.projectedValues || [13200, 14100, 15000];
  
  const predictiveChartData = [
    {
      name: "Historical Data",
      data: historicalValues
    },
    {
      name: "Projected Data", 
      data: [null, null, null, historicalValues[historicalValues.length - 1], ...projectedValues]
    }
  ];

  const predictiveChartOptions = {
    chart: {
      type: "line",
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    xaxis: {
      categories: ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4"]
    },
    yaxis: {
      title: {
        text: "Number of People Trained"
      }
    },
    stroke: {
      curve: "smooth",
      width: [3, 3],
      dashArray: [0, 5]
    },
    colors: ["#667eea", "#f59e0b"],
    markers: {
      size: [6, 4],
      strokeColors: ["#667eea", "#f59e0b"],
      fillColors: ["#667eea", "#f59e0b"]
    },
    legend: {
      show: true,
      position: 'top'
    },
    annotations: {
      xaxis: [{
        x: 3.5,
        borderColor: '#e5e7eb',
        label: {
          text: 'Forecast →',
          style: {
            color: '#6b7280'
          }
        }
      }]
    }
  };

  // Anomaly detection visual data
  const anomalies = metrics.anomalies || [];
  const hasAnomalies = anomalies.length > 0;

  // Country performance chart with anomaly highlighting
  const countryData = data.countries
    .filter(c => c.status === "active")
    .slice(0, 6)
    .map(c => {
      const countryTraining = metrics.countryPerformance?.[c.name] || c.totalReach;
      const hasAnomaly = anomalies.some(a => a.region === c.name);
      return {
        name: c.name,
        reach: countryTraining,
        hasAnomaly
      };
    });

  const countryChartData = [{
    name: "Training Participation",
    data: countryData.map(c => ({
      x: c.name,
      y: c.reach,
      fillColor: c.hasAnomaly ? '#dc2626' : '#667eea'
    }))
  }];

  const countryChartOptions = {
    chart: {
      type: "bar"
    },
    xaxis: {
      categories: countryData.map(c => c.name)
    },
    yaxis: {
      title: {
        text: "People Trained (Current Quarter)"
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true
      }
    },
    colors: countryData.map(c => c.hasAnomaly ? '#dc2626' : '#667eea'),
    legend: {
      show: false
    }
  };

return (
    <div className="space-y-6">
      {/* Anomaly Alerts */}
      {hasAnomalies && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-warning rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">!</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Anomalies Detected</h4>
              <div className="space-y-2">
                {anomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      anomaly.severity === 'high' ? 'bg-error' : 
                      anomaly.severity === 'medium' ? 'bg-warning' : 'bg-info'
                    }`}></div>
                    <span className="text-gray-800">{anomaly.description}</span>
                    {anomaly.region && (
                      <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {anomaly.region}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total People Reached"
          value={metrics.totalPeopleReached}
          change="+12.5%"
          changeType="positive"
          icon="Users"
          gradient="from-primary to-secondary"
        />
        
        <StatsCard
          title="Female Participation"
          value={metrics.femaleParticipationRate}
          unit="%"
          change="+2.1%"
          changeType="positive"
          icon="Heart"
          gradient="from-pink-500 to-rose-500"
        />
        
        <StatsCard
          title="Projected Q2 2024"
          value={projectedValues[0] || 13200}
          change={`${(metrics.growthRate * 100).toFixed(1)}% growth rate`}
          changeType={metrics.growthRate > 0 ? "positive" : "negative"}
          icon="TrendingUp"
          gradient="from-success to-green-600"
        />
        
        <StatsCard
          title="Active Countries"
          value={metrics.activeCountries}
          change={hasAnomalies ? `${anomalies.length} alerts` : "0 alerts"}
          changeType={hasAnomalies ? "negative" : "positive"}
          icon="Globe"
          gradient="from-info to-blue-600"
        />
      </div>

      {/* Predictive Analytics and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Target Achievement</h3>
            <div className="space-y-6">
              <ProgressRing
                progress={Math.round((metrics.totalPeopleReached / 500000) * 100)}
                title="People Trained"
                subtitle={`${metrics.totalPeopleReached.toLocaleString()} / 500K`}
                color="#667eea"
                size={120}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{metrics.activeProjects}</div>
                  <div className="text-xs text-gray-600">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{metrics.totalWomenParticipants.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Women Reached</div>
                </div>
              </div>

              {/* Growth Rate Indicator */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Growth Rate</span>
                  <span className={`text-sm font-bold ${
                    metrics.growthRate > 0 ? 'text-success' : 'text-error'
                  }`}>
                    {(metrics.growthRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Quarterly average trend
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Trends Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Predictive Training Analytics"
            subtitle="Historical data with projected future completions"
            chartData={predictiveChartData}
            chartOptions={predictiveChartOptions}
            type="line"
            height={280}
          />
        </div>
      </div>

      {/* Regional Performance and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Regional Training Performance"
          subtitle={`Current quarter participation ${hasAnomalies ? '(Red = Anomaly Detected)' : ''}`}
          chartData={countryChartData}
          chartOptions={countryChartOptions}
          type="bar"
          height={300}
        />

        {/* Enhanced Activity with Anomaly Tracking */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts & Activity</h3>
          <div className="space-y-4">
            {/* Show anomalies first */}
            {anomalies.slice(0, 2).map((anomaly, index) => (
              <div key={`anomaly-${index}`} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  anomaly.severity === 'high' ? 'bg-error' : 'bg-warning'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">
                    {anomaly.type === 'training_drop' ? '📉 ' : '🎯 '}
                    {anomaly.description}
                  </p>
                  <p className="text-xs text-gray-600">Detected automatically</p>
                </div>
              </div>
            ))}
            
            {/* Regular activity */}
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-success mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">Q1 2024 data approved for Cambodia</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-warning mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">Philippines data pending review</p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-info mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">New project launched in Solomon Islands</p>
                <p className="text-xs text-gray-600">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;