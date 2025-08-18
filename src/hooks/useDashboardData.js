import { useState, useEffect } from "react";
import { countryService } from "@/services/api/countryService";
import { projectService } from "@/services/api/projectService";
import { dataPointService } from "@/services/api/dataPointService";
import { indicatorService } from "@/services/api/indicatorService";

export const useDashboardData = (selectedCountry = null) => {
  const [data, setData] = useState({
    countries: [],
    projects: [],
    dataPoints: [],
    indicators: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [countries, projects, dataPoints, indicators] = await Promise.all([
        countryService.getAll(),
        projectService.getAll(),
        dataPointService.getAll(),
        indicatorService.getAll()
      ]);

      // Filter data if specific country is selected
      let filteredProjects = projects;
      let filteredDataPoints = dataPoints;

      if (selectedCountry) {
        const country = countries.find(c => c.code.toLowerCase() === selectedCountry.toLowerCase());
        if (country) {
          filteredProjects = projects.filter(p => p.countryId === country.Id);
          const projectIds = filteredProjects.map(p => p.Id);
          filteredDataPoints = dataPoints.filter(dp => projectIds.includes(dp.projectId));
        }
      }

      setData({
        countries,
        projects: filteredProjects,
        dataPoints: filteredDataPoints,
        indicators
      });
    } catch (err) {
      setError(err.message);
      console.error("Dashboard data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedCountry]);

  // Calculate key metrics
const calculateMetrics = () => {
    const { countries, projects, dataPoints, indicators } = data;

    // Total people reached (sum of all approved data points for indicator 1)
    const peopleTrainedIndicator = indicators.find(ind => ind.Id === 1);
    const peopleTrainedPoints = dataPoints.filter(dp => 
      dp.indicatorId === 1 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalPeopleReached = peopleTrainedPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Female participation calculation
    const womenParticipantsPoints = dataPoints.filter(dp => 
      dp.indicatorId === 2 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalWomenParticipants = womenParticipantsPoints.reduce((sum, dp) => sum + dp.value, 0);
    const femaleParticipationRate = totalPeopleReached > 0 ? (totalWomenParticipants / totalPeopleReached * 100).toFixed(1) : 0;

    // Total loans disbursed
    const loansPoints = dataPoints.filter(dp => 
      dp.indicatorId === 4 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalLoansValue = loansPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Active countries
    const activeCountries = selectedCountry ? 1 : countries.filter(c => c.status === "active").length;

    // Active projects
    const activeProjects = projects.filter(p => p.status === "active").length;

    // Training sessions (indicator 7)
    const trainingSessionsPoints = dataPoints.filter(dp => 
      dp.indicatorId === 7 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalTrainingSessions = trainingSessionsPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Historical data analysis for predictive insights
    const historicalData = dataPoints.filter(dp => 
      dp.indicatorId === 1 && 
      dp.status === "approved" &&
      ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"].includes(dp.period)
    );

    // Group historical data by period and calculate totals
    const quarterlyData = {};
    historicalData.forEach(dp => {
      if (!quarterlyData[dp.period]) {
        quarterlyData[dp.period] = 0;
      }
      quarterlyData[dp.period] += dp.value;
    });

    const quarters = ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"];
    const quarterlyValues = quarters.map(q => quarterlyData[q] || 0);

    // Calculate growth rate and predict next quarters
    const growthRates = [];
    for (let i = 1; i < quarterlyValues.length; i++) {
      if (quarterlyValues[i - 1] > 0) {
        growthRates.push((quarterlyValues[i] - quarterlyValues[i - 1]) / quarterlyValues[i - 1]);
      }
    }

    const avgGrowthRate = growthRates.length > 0 ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;

    // Project next 3 quarters
    const currentValue = quarterlyValues[quarterlyValues.length - 1] || 0;
    const projectedQ2 = Math.round(currentValue * (1 + avgGrowthRate));
    const projectedQ3 = Math.round(projectedQ2 * (1 + avgGrowthRate));
    const projectedQ4 = Math.round(projectedQ3 * (1 + avgGrowthRate));

    // Anomaly detection - identify unusual patterns
    const anomalies = [];
    
    // Check for sudden drops (more than 15% decrease)
    for (let i = 1; i < quarterlyValues.length; i++) {
      const prevValue = quarterlyValues[i - 1];
      const currentValue = quarterlyValues[i];
      if (prevValue > 0 && ((prevValue - currentValue) / prevValue) > 0.15) {
        anomalies.push({
          type: 'training_drop',
          period: quarters[i],
          severity: 'high',
          description: `${Math.round(((prevValue - currentValue) / prevValue) * 100)}% drop in training participation`,
          value: currentValue,
          expectedValue: prevValue
        });
      }
    }

    // Regional anomaly detection by country
    const countryTrainingData = {};
    dataPoints.forEach(dp => {
      if (dp.indicatorId === 1 && dp.status === "approved" && dp.period === "2024-Q1") {
        const project = projects.find(p => p.Id === dp.projectId);
        if (project) {
          const country = countries.find(c => c.Id === project.countryId);
          if (country) {
            if (!countryTrainingData[country.name]) {
              countryTrainingData[country.name] = 0;
            }
            countryTrainingData[country.name] += dp.value;
          }
        }
      }
    });

    // Check for countries with unusually low participation
    const countryValues = Object.values(countryTrainingData);
    const avgCountryParticipation = countryValues.length > 0 ? countryValues.reduce((sum, val) => sum + val, 0) / countryValues.length : 0;
    
    Object.entries(countryTrainingData).forEach(([countryName, value]) => {
      if (avgCountryParticipation > 0 && value < (avgCountryParticipation * 0.5)) {
        anomalies.push({
          type: 'regional_underperformance',
          region: countryName,
          severity: 'medium',
          description: `${countryName} training participation 50% below average`,
          value: value,
          expectedValue: Math.round(avgCountryParticipation)
        });
      }
    });

    return {
      totalPeopleReached,
      femaleParticipationRate: parseFloat(femaleParticipationRate),
      totalLoansValue,
      activeCountries,
      activeProjects,
      totalTrainingSessions,
      totalWomenParticipants,
      // Predictive analytics
      historicalQuarterly: quarterlyValues,
      projectedValues: [projectedQ2, projectedQ3, projectedQ4],
      growthRate: avgGrowthRate,
      anomalies,
      countryPerformance: countryTrainingData
    };
  };

  const metrics = calculateMetrics();

  return {
    data,
    metrics,
    loading,
    error,
    refetch: loadDashboardData
  };
};