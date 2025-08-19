import React from "react";
import { useSelector } from "react-redux";
import { useDashboardData } from "@/hooks/useDashboardData";
import ApperIcon from "@/components/ApperIcon";
import Projects from "@/components/pages/Projects";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import StatsCard from "@/components/molecules/StatsCard";
import ProgressRing from "@/components/molecules/ProgressRing";
import ChartCard from "@/components/molecules/ChartCard";

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

// Enhanced chart data for comprehensive results visualization
  const historicalValues = metrics.historicalQuarterly || [11800, 13100, 14200, 12500];
  const projectedValues = metrics.projectedValues || [13200, 14100, 15000];
  
  // Predictive analytics chart with trend indicators
  const predictiveChartData = [
    {
      name: "Historical Performance",
      data: historicalValues,
      type: 'line'
    },
    {
      name: "Projected Growth", 
      data: [null, null, null, historicalValues[historicalValues.length - 1], ...projectedValues],
      type: 'line'
    },
    {
      name: "Growth Trend",
      data: historicalValues.map((val, idx) => idx === 0 ? val : val + (metrics.growthRate * 1000 * idx)),
      type: 'area'
    }
  ];

  const predictiveChartOptions = {
    chart: {
      type: "line",
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        }
      }
    },
    xaxis: {
      categories: ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4"],
      title: {
        text: "Reporting Periods"
      }
    },
    yaxis: {
      title: {
        text: "Number of People Trained"
      },
      labels: {
        formatter: function(val) {
          return val >= 1000 ? (val/1000).toFixed(1) + 'K' : val;
        }
      }
    },
    stroke: {
      curve: "smooth",
      width: [4, 4, 2],
      dashArray: [0, 8, 0]
    },
    fill: {
      type: ['solid', 'solid', 'gradient'],
      opacity: [1, 0.8, 0.3],
      gradient: {
        shade: 'light',
        type: 'vertical',
        opacityFrom: 0.4,
        opacityTo: 0.1,
      }
    },
    colors: ["#667eea", "#f59e0b", "#28a745"],
    markers: {
      size: [6, 4, 0],
      strokeColors: ["#667eea", "#f59e0b", "#28a745"],
      fillColors: ["#667eea", "#f59e0b", "#28a745"]
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center'
    },
    annotations: {
      xaxis: [{
        x: 3.5,
        borderColor: '#e5e7eb',
        borderWidth: 2,
        strokeDashArray: 5,
        label: {
          text: 'Forecast Period →',
          style: {
            color: '#6b7280',
            background: '#f8fafc',
            fontSize: '12px'
          }
        }
      }],
      points: metrics.anomalies.map(anomaly => ({
        x: anomaly.period,
        y: anomaly.value,
        marker: {
          size: 8,
          fillColor: '#dc2626',
          strokeColor: '#ffffff',
          radius: 4
        },
        label: {
          text: 'Anomaly Detected',
          style: {
            color: '#ffffff',
            background: '#dc2626'
          }
        }
      }))
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function(val) {
          if (val === null) return '';
          return val >= 1000 ? (val/1000).toFixed(1) + 'K people' : val + ' people';
        }
      }
    }
  };

  // Enhanced anomaly detection visual data
  const anomalies = metrics.anomalies || [];
  const hasAnomalies = anomalies.length > 0;

  // Country performance chart with enhanced visualization
  const countryData = data.countries
    .filter(c => c.status === "active")
    .slice(0, 8)
    .map(c => {
      const countryTraining = metrics.countryPerformance?.[c.name] || c.totalReach || 0;
      const hasAnomaly = anomalies.some(a => a.region === c.name);
      const performance = countryTraining > (metrics.totalPeopleReached / data.countries.length) ? 'high' : 'normal';
      return {
        name: c.name,
        reach: countryTraining,
        hasAnomaly,
        performance,
        target: Math.round(countryTraining * 1.15) // 15% growth target
      };
    })
    .sort((a, b) => b.reach - a.reach);

const countryChartData = [
    {
      name: "Current Performance",
      data: countryData.map(c => c.reach)
    },
    {
      name: "Growth Target",
      data: countryData.map(c => c.target)
    }
  ];

  const countryChartOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: true
      }
    },
    xaxis: {
      categories: countryData.map(c => c.name),
      title: {
        text: "Countries"
      }
    },
    yaxis: {
      title: {
        text: "People Trained (Current Quarter)"
      },
      labels: {
        formatter: function(val) {
          return val >= 1000 ? (val/1000).toFixed(1) + 'K' : val;
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ["#667eea", "#f1c40f"],
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val >= 1000 ? (val/1000).toFixed(1) + 'K' : val;
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: ["#304758"]
      }
    },
    legend: {
      show: true,
      position: 'top'
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val >= 1000 ? (val/1000).toFixed(1) + 'K people' : val + ' people';
        }
      }
    }
  };

  // Performance insights chart data
  const performanceInsights = {
    growth: ((projectedValues[0] - historicalValues[historicalValues.length - 1]) / historicalValues[historicalValues.length - 1] * 100).toFixed(1),
    trend: metrics.growthRate > 0 ? 'positive' : 'negative',
    topPerformer: countryData[0]?.name || 'N/A',
    anomaliesCount: anomalies.length
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

{/* Results Summary Cards */}
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
          title="Growth Projection"
          value={performanceInsights.growth}
          unit="%"
          change={`Next quarter forecast`}
          changeType={performanceInsights.trend}
          icon="TrendingUp"
          gradient="from-success to-green-600"
        />
        
        <StatsCard
          title="Data Quality Score"
          value={hasAnomalies ? Math.max(85 - (anomalies.length * 10), 0) : 95}
          unit="%"
          change={hasAnomalies ? `${anomalies.length} anomalies detected` : "No anomalies"}
          changeType={hasAnomalies ? "negative" : "positive"}
          icon="Shield"
          gradient="from-info to-blue-600"
        />
      </div>

      {/* Chart Results Analysis Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-primary">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ApperIcon name="BarChart3" size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Growth Trend:</span>
                <div className="text-gray-600 mt-1">
                  {performanceInsights.trend === 'positive' ? 
                    `📈 Positive growth of ${performanceInsights.growth}%` : 
                    `📉 Decline of ${Math.abs(performanceInsights.growth)}%`
                  }
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Top Performer:</span>
                <div className="text-gray-600 mt-1">
                  🏆 {performanceInsights.topPerformer} leads with {countryData[0]?.reach >= 1000 ? 
                    `${(countryData[0]?.reach/1000).toFixed(1)}K` : countryData[0]?.reach} people
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Data Insights:</span>
                <div className="text-gray-600 mt-1">
                  {hasAnomalies ? 
                    `⚠️ ${anomalies.length} anomalies require attention` : 
                    `✅ All data points within normal ranges`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
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
<div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
             onClick={() => window.location.href = '/countries'}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ApperIcon name="Globe" size={20} className="text-primary" />
                Countries Performance
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View detailed country-by-country performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="text-sm font-medium">View All</span>
              <ApperIcon name="ArrowRight" size={16} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-primary-50 rounded-lg">
              <div className="text-xl font-bold text-primary">
                {data.countries?.filter(c => c.status === 'active').length || 0}
              </div>
              <div className="text-xs text-primary-700">Active Countries</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {Math.round((data.countries?.filter(c => c.status === 'active').length || 0) * 0.8)}
              </div>
              <div className="text-xs text-green-700">On Track</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ApperIcon name="MousePointer" size={14} className="mr-1" />
            Click to explore country details
          </div>
        </div>

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