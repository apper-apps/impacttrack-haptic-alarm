import dataPointsData from "@/services/mockData/dataPoints.json";
import projectsData from "@/services/mockData/projects.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const dataPointService = {
  async getAll() {
    await delay(300);
    return [...dataPointsData];
  },

  async getById(id) {
    await delay(250);
    const dataPoint = dataPointsData.find(dp => dp.Id === parseInt(id));
    if (!dataPoint) {
      throw new Error(`DataPoint with Id ${id} not found`);
    }
    return { ...dataPoint };
  },

  async getByProject(projectId) {
    await delay(300);
    return dataPointsData.filter(dp => dp.projectId === parseInt(projectId)).map(dp => ({ ...dp }));
  },

  async getByIndicator(indicatorId) {
    await delay(300);
    return dataPointsData.filter(dp => dp.indicatorId === parseInt(indicatorId)).map(dp => ({ ...dp }));
  },

  async getByPeriod(period) {
    await delay(300);
    return dataPointsData.filter(dp => dp.period === period).map(dp => ({ ...dp }));
  },

  async getByCountry(countryId) {
    await delay(350);
    const countryProjects = projectsData.filter(p => p.countryId === parseInt(countryId));
    const projectIds = countryProjects.map(p => p.Id);
    return dataPointsData.filter(dp => projectIds.includes(dp.projectId)).map(dp => ({ ...dp }));
  },
// Approval workflow methods
  async approve(id, approverName = "System") {
    await delay(300);
    return this.update(id, {
      status: "approved",
      approvedBy: approverName,
      approvedAt: new Date().toISOString(),
      approvalWorkflow: "approved"
    });
  },

  async reject(id, reason = "", rejectorName = "System") {
    await delay(300);
    return this.update(id, {
      status: "rejected",
      rejectedBy: rejectorName,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      approvalWorkflow: "rejected",
      feedback: reason
    });
  },

// Get submissions pending review
  async getPendingReview() {
    await delay(200);
    return dataPointsData.filter(item => 
      item.status === "submitted" || item.status === "in_review"
    ).map(item => ({ ...item }));
  },

  // Update submission status (for workflow management)
  async updateSubmissionStatus(id, status, additionalData = {}) {
    await delay(200);
    const index = dataPointsData.findIndex(item => item.Id === id);
    if (index === -1) {
      throw new Error(`DataPoint with ID ${id} not found`);
    }

    const updatedData = {
      ...dataPointsData[index],
      status,
      approvalWorkflow: status,
      ...additionalData,
      updatedAt: new Date().toISOString()
    };

    dataPointsData[index] = updatedData;
    return { ...updatedData };
  },
async create(dataPointData) {
    await delay(400);
    const newId = Math.max(...dataPointsData.map(dp => dp.Id), 0) + 1;
    const newDataPoint = {
      Id: newId,
      submittedAt: new Date().toISOString(),
      status: "pending",
      approvedBy: null,
      ...dataPointData
    };
    dataPointsData.push(newDataPoint);
    return { ...newDataPoint };
  },

  async bulkCreate(dataPointsArray) {
    await delay(600);
    const createdDataPoints = [];
    
    for (const dataPointData of dataPointsArray) {
      const newId = Math.max(...dataPointsData.map(dp => dp.Id), 0) + 1;
      const newDataPoint = {
        Id: newId,
        submittedAt: new Date().toISOString(),
        status: "pending",
        approvedBy: null,
        ...dataPointData
      };
      dataPointsData.push(newDataPoint);
      createdDataPoints.push({ ...newDataPoint });
    }
    
    return createdDataPoints;
  },

  async update(id, updateData) {
    await delay(350);
    const index = dataPointsData.findIndex(dp => dp.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`DataPoint with Id ${id} not found`);
    }
    dataPointsData[index] = { ...dataPointsData[index], ...updateData };
    return { ...dataPointsData[index] };
  },
async delete(id) {
    await delay(300);
    const index = dataPointsData.findIndex(dp => dp.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`DataPoint with Id ${id} not found`);
    }
    const deletedDataPoint = dataPointsData.splice(index, 1)[0];
    return { ...deletedDataPoint };
  }
};