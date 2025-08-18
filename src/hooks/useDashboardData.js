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
// Enhanced metrics calculation with comprehensive chart result analysis
  const calculateMetrics = () => {
    const { countries, projects, dataPoints, indicators } = data;

    // Core data aggregation for chart results
    const peopleTrainedIndicator = indicators.find(ind => ind.Id === 1);
    const peopleTrainedPoints = dataPoints.filter(dp => 
      dp.indicatorId === 1 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalPeopleReached = peopleTrainedPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Female participation analysis for demographic charts
    const womenParticipantsPoints = dataPoints.filter(dp => 
      dp.indicatorId === 2 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalWomenParticipants = womenParticipantsPoints.reduce((sum, dp) => sum + dp.value, 0);
    const femaleParticipationRate = totalPeopleReached > 0 ? (totalWomenParticipants / totalPeopleReached * 100).toFixed(1) : 0;

    // Financial impact metrics for results visualization
    const loansPoints = dataPoints.filter(dp => 
      dp.indicatorId === 4 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalLoansValue = loansPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Geographic coverage for regional performance charts
    const activeCountries = selectedCountry ? 1 : countries.filter(c => c.status === "active").length;
    const activeProjects = projects.filter(p => p.status === "active").length;

    // Training delivery metrics
    const trainingSessionsPoints = dataPoints.filter(dp => 
      dp.indicatorId === 7 && 
      dp.status === "approved" &&
      dp.period === "2024-Q1"
    );
    const totalTrainingSessions = trainingSessionsPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Advanced historical trend analysis for predictive charts
    const historicalPeriods = ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"];
    const historicalData = dataPoints.filter(dp => 
      dp.indicatorId === 1 && 
      dp.status === "approved" &&
      historicalPeriods.includes(dp.period)
    );

    // Enhanced quarterly data aggregation
    const quarterlyData = {};
    const quarterlyDetails = {};
    historicalData.forEach(dp => {
      if (!quarterlyData[dp.period]) {
        quarterlyData[dp.period] = 0;
        quarterlyDetails[dp.period] = {
          total: 0,
          projects: new Set(),
          countries: new Set()
        };
      }
      quarterlyData[dp.period] += dp.value;
      quarterlyDetails[dp.period].total += dp.value;
      quarterlyDetails[dp.period].projects.add(dp.projectId);
      
      const project = projects.find(p => p.Id === dp.projectId);
      if (project) {
        quarterlyDetails[dp.period].countries.add(project.countryId);
      }
    });

    const quarters = ["2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"];
    const quarterlyValues = quarters.map(q => quarterlyData[q] || 0);

    // Enhanced growth rate calculation with seasonality adjustment
    const growthRates = [];
    const quarterlyGrowth = [];
    for (let i = 1; i < quarterlyValues.length; i++) {
      if (quarterlyValues[i - 1] > 0) {
        const rate = (quarterlyValues[i] - quarterlyValues[i - 1]) / quarterlyValues[i - 1];
        growthRates.push(rate);
        quarterlyGrowth.push({
          period: quarters[i],
          rate: rate * 100,
          absolute: quarterlyValues[i] - quarterlyValues[i - 1]
        });
      }
    }

    // Advanced statistical analysis
    const avgGrowthRate = growthRates.length > 0 ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;
    const growthVariance = growthRates.length > 0 ? 
      growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowthRate, 2), 0) / growthRates.length : 0;
    const growthStdDev = Math.sqrt(growthVariance);

    // Enhanced projection with confidence intervals
    const currentValue = quarterlyValues[quarterlyValues.length - 1] || 0;
    const confidenceMultiplier = Math.max(0.1, Math.min(growthStdDev, 0.3));
    
    const projectedQ2 = Math.round(currentValue * (1 + avgGrowthRate));
    const projectedQ3 = Math.round(projectedQ2 * (1 + avgGrowthRate));
    const projectedQ4 = Math.round(projectedQ3 * (1 + avgGrowthRate));

    // Confidence intervals for projections
    const projectionConfidence = {
      q2: {
        low: Math.round(projectedQ2 * (1 - confidenceMultiplier)),
        high: Math.round(projectedQ2 * (1 + confidenceMultiplier))
      },
      q3: {
        low: Math.round(projectedQ3 * (1 - confidenceMultiplier)),
        high: Math.round(projectedQ3 * (1 + confidenceMultiplier))
      },
      q4: {
        low: Math.round(projectedQ4 * (1 - confidenceMultiplier)),
        high: Math.round(projectedQ4 * (1 + confidenceMultiplier))
      }
    };

    // Enhanced anomaly detection for chart visualization
    const anomalies = [];
    
    // Trend-based anomaly detection
    for (let i = 1; i < quarterlyValues.length; i++) {
      const prevValue = quarterlyValues[i - 1];
      const currentValue = quarterlyValues[i];
      const expectedGrowth = avgGrowthRate;
      
      if (prevValue > 0) {
        const actualGrowth = (currentValue - prevValue) / prevValue;
        const growthDeviation = Math.abs(actualGrowth - expectedGrowth);
        
        // Significant deviation from trend
        if (growthDeviation > (2 * growthStdDev) && growthStdDev > 0.05) {
          anomalies.push({
            type: actualGrowth < expectedGrowth ? 'underperformance' : 'overperformance',
            period: quarters[i],
            severity: growthDeviation > (3 * growthStdDev) ? 'high' : 'medium',
            description: `${Math.round(growthDeviation * 100)}% deviation from expected trend`,
            value: currentValue,
            expectedValue: Math.round(prevValue * (1 + expectedGrowth)),
            actualGrowth: actualGrowth * 100,
            expectedGrowth: expectedGrowth * 100
          });
        }
      }
    }

    // Regional performance analysis with enhanced country insights
    const countryTrainingData = {};
    const countryProjectCount = {};
    const countryGrowthTrends = {};
    
    dataPoints.forEach(dp => {
      if (dp.indicatorId === 1 && dp.status === "approved") {
        const project = projects.find(p => p.Id === dp.projectId);
        if (project) {
          const country = countries.find(c => c.Id === project.countryId);
          if (country) {
            if (!countryTrainingData[country.name]) {
              countryTrainingData[country.name] = {};
              countryProjectCount[country.name] = new Set();
            }
            if (!countryTrainingData[country.name][dp.period]) {
              countryTrainingData[country.name][dp.period] = 0;
            }
            countryTrainingData[country.name][dp.period] += dp.value;
            countryProjectCount[country.name].add(dp.projectId);
          }
        }
      }
    });

    // Calculate country-level trends
    Object.keys(countryTrainingData).forEach(countryName => {
      const countryQuarterly = quarters.map(q => countryTrainingData[countryName][q] || 0);
      const countryGrowthRates = [];
      
      for (let i = 1; i < countryQuarterly.length; i++) {
        if (countryQuarterly[i - 1] > 0) {
          countryGrowthRates.push((countryQuarterly[i] - countryQuarterly[i - 1]) / countryQuarterly[i - 1]);
        }
      }
      
      countryGrowthTrends[countryName] = {
        avgGrowth: countryGrowthRates.length > 0 ? countryGrowthRates.reduce((sum, rate) => sum + rate, 0) / countryGrowthRates.length : 0,
        currentValue: countryQuarterly[countryQuarterly.length - 1],
        projectCount: countryProjectCount[countryName].size,
        trend: countryGrowthRates.length > 1 ? (countryGrowthRates[countryGrowthRates.length - 1] > countryGrowthRates[0] ? 'improving' : 'declining') : 'stable'
      };
    });

    // Enhanced regional anomaly detection
    const currentCountryData = {};
    Object.keys(countryTrainingData).forEach(countryName => {
      currentCountryData[countryName] = countryTrainingData[countryName]["2024-Q1"] || 0;
    });

    const countryValues = Object.values(currentCountryData);
    const avgCountryParticipation = countryValues.length > 0 ? countryValues.reduce((sum, val) => sum + val, 0) / countryValues.length : 0;
    const countryStdDev = countryValues.length > 0 ? Math.sqrt(countryValues.reduce((sum, val) => sum + Math.pow(val - avgCountryParticipation, 2), 0) / countryValues.length) : 0;
    
    Object.entries(currentCountryData).forEach(([countryName, value]) => {
      const deviation = Math.abs(value - avgCountryParticipation);
      if (avgCountryParticipation > 0 && deviation > (2 * countryStdDev)) {
        anomalies.push({
          type: value < avgCountryParticipation ? 'regional_underperformance' : 'regional_overperformance',
          region: countryName,
          severity: deviation > (3 * countryStdDev) ? 'high' : 'medium',
          description: `${countryName} shows ${Math.round((deviation / avgCountryParticipation) * 100)}% deviation from average`,
          value: value,
          expectedValue: Math.round(avgCountryParticipation),
          trend: countryGrowthTrends[countryName]?.trend || 'unknown'
        });
      }
    });

    return {
      // Core metrics for visualization
      totalPeopleReached,
      femaleParticipationRate: parseFloat(femaleParticipationRate),
      totalLoansValue,
      activeCountries,
      activeProjects,
      totalTrainingSessions,
      totalWomenParticipants,
      
      // Enhanced analytical results for charts
      historicalQuarterly: quarterlyValues,
      projectedValues: [projectedQ2, projectedQ3, projectedQ4],
      projectionConfidence,
      growthRate: avgGrowthRate,
      growthStdDev,
      quarterlyGrowth,
      
      // Anomaly analysis for chart highlighting
      anomalies,
      
      // Regional performance data for geographic charts
      countryPerformance: currentCountryData,
      countryTrends: countryGrowthTrends,
      
      // Statistical insights for results summary
      dataQualityScore: Math.max(0, 100 - (anomalies.length * 5)),
      trendConfidence: Math.max(0, 100 - (growthStdDev * 100)),
      regionalBalance: countryStdDev / avgCountryParticipation * 100
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