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

    return {
      totalPeopleReached,
      femaleParticipationRate: parseFloat(femaleParticipationRate),
      totalLoansValue,
      activeCountries,
      activeProjects,
      totalTrainingSessions,
      totalWomenParticipants
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