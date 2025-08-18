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
  const quarterlyTrendData = [{
    name: "People Trained",
    data: [11800, 13100, 14200, 12500] // Q2, Q3, Q4 2023, Q1 2024
  }];

  const quarterlyTrendOptions = {
    chart: {
      type: "line"
    },
    xaxis: {
      categories: ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"]
    },
    yaxis: {
      title: {
        text: "Number of People"
      }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    markers: {
      size: 6
    }
  };

  // Country performance chart
  const countryData = data.countries
    .filter(c => c.status === "active")
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      reach: c.totalReach
    }));

  const countryChartData = [{
    name: "People Reached",
    data: countryData.map(c => c.reach)
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
        text: "People Reached"
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false
      }
    }
  };

  return (
    <div className="space-y-6">
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
          title="Loans Disbursed"
          value={metrics.totalLoansValue}
          change="+18.3%"
          changeType="positive"
          icon="DollarSign"
          gradient="from-success to-green-600"
        />
        
        <StatsCard
          title="Active Countries"
          value={metrics.activeCountries}
          change="0%"
          changeType="neutral"
          icon="Globe"
          gradient="from-info to-blue-600"
        />
      </div>

      {/* Progress Rings and Charts */}
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
                  <div className="text-sm text-gray-600">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{metrics.totalWomenParticipants.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Women Reached</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quarterly Trends */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Quarterly Training Trends"
            subtitle="People trained in financial literacy over time"
            chartData={quarterlyTrendData}
            chartOptions={quarterlyTrendOptions}
            type="line"
            height={280}
          />
        </div>
      </div>

      {/* Country Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Performing Countries"
          subtitle="People reached by country"
          chartData={countryChartData}
          chartOptions={countryChartOptions}
          type="bar"
          height={300}
        />

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
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
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-success mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">Training milestone reached in Samoa</p>
                <p className="text-xs text-gray-600">1 week ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;