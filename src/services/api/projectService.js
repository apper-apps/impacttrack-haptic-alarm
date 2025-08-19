import projectsData from "@/services/mockData/projects.json";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let projects = [...projectsData];

export const projectService = {
async getAll() {
    await delay(300);
    // Ensure all projects have required properties
    const riskLevels = ["low", "medium", "high"];
    return projects.map(project => ({
      ...project,
      riskLevel: project.riskLevel || riskLevels[Math.floor(Math.random() * riskLevels.length)]
    }));
  },

  async getById(id) {
    await delay(200);
    const project = projects.find(p => p.Id === parseInt(id));
    if (!project) {
      throw new Error("Project not found");
    }
    return { ...project };
  },

async create(projectData) {
    await delay(400);
    const riskLevels = ["low", "medium", "high"];
    const newProject = {
      ...projectData,
      Id: Math.max(...projects.map(p => p.Id), 0) + 1,
      riskLevel: projectData.riskLevel || riskLevels[Math.floor(Math.random() * riskLevels.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects = [...projects, newProject];
    return { ...newProject };
  },

  async update(id, projectData) {
    await delay(400);
    const index = projects.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Project not found");
    }
    
projects[index] = {
      ...projects[index],
      ...projectData,
      Id: parseInt(id),
      riskLevel: projectData.riskLevel || projects[index].riskLevel || "low",
      updatedAt: new Date().toISOString()
    };
    
    return { ...projects[index] };
  },

  async delete(id) {
    await delay(300);
    const index = projects.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error("Project not found");
    }
    
    projects = projects.filter(p => p.Id !== parseInt(id));
    return true;
  },

  async bulkUpdateStatus(projectIds, newStatus) {
    await delay(600);
    const validStatuses = ["active", "completed", "paused", "inactive"];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

projects = projects.map(project => {
      if (projectIds.includes(project.Id)) {
        return {
          ...project,
          status: newStatus,
          riskLevel: project.riskLevel || "low",
          updatedAt: new Date().toISOString()
        };
      }
      return {
        ...project,
        riskLevel: project.riskLevel || "low"
      };
    });

    return projects.filter(p => projectIds.includes(p.Id));
  },

  async exportProjects(projectIds = null) {
    await delay(800);
    const exportData = projectIds 
      ? projects.filter(p => projectIds.includes(p.Id))
      : projects;

    // Simulate export process
    const csvContent = this.generateCsvContent(exportData);
    
    // In a real app, this would trigger a download
    if (typeof window !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `projects-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    }

    return exportData;
  },

  generateCsvContent(data) {
    const headers = [
      "ID", "Name", "Description", "Country ID", "Status", "Risk Level",
      "Current Reach", "Target Reach", "Budget", "Start Date", "End Date"
    ];

    const rows = data.map(project => [
      project.Id,
      `"${project.name}"`,
      `"${project.description}"`,
      project.countryId,
      project.status,
      project.riskLevel,
      project.currentReach,
      project.targetReach,
      project.budget,
      project.startDate,
      project.endDate
    ]);

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  },

  async getProjectStatistics() {
    await delay(200);
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === "active").length;
    const totalReach = projects.reduce((sum, p) => sum + p.currentReach, 0);
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    
    const avgAchievement = totalProjects > 0
      ? projects.reduce((sum, p) => sum + (p.currentReach / p.targetReach), 0) / totalProjects * 100
      : 0;

    return {
      totalProjects,
      activeProjects,
      totalReach,
      totalBudget,
avgAchievement: Math.round(avgAchievement * 100) / 100
    };
  },

  async getByCountry(countryId) {
    await delay(300);
    return projects.filter(p => p.countryId === parseInt(countryId)).map(p => ({ ...p }));
  }
};