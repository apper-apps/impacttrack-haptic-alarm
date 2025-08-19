import dataPointsData from "@/services/mockData/dataPoints.json";
import projectsData from "@/services/mockData/projects.json";
import indicatorsData from "@/services/mockData/indicators.json";
import usersData from "@/services/mockData/users.json";
// Service utilities
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const dataPointService = {
  async getAll() {
    await delay(Math.random() * 800 + 200);
    
    const enrichedDataPoints = dataPointsData.map(dataPoint => {
      const project = projectsData.find(p => p.id === dataPoint.projectId);
      const indicator = indicatorsData.find(i => i.id === dataPoint.indicatorId);
      const user = usersData.find(u => u.id === dataPoint.submittedBy);
      
      return {
        ...dataPoint,
        projectName: project?.name || 'Unknown Project',
        indicatorName: indicator?.name || 'Unknown Indicator',
        submittedByName: user?.name || 'Unknown User'
      };
    });
    
    return enrichedDataPoints;
  },

  async getById(id) {
    await delay(Math.random() * 400 + 100);
    
    const dataPoint = dataPointsData.find(dp => dp.id === parseInt(id));
    if (!dataPoint) {
      throw new Error(`Data point with id ${id} not found`);
    }
    
    const project = projectsData.find(p => p.id === dataPoint.projectId);
    const indicator = indicatorsData.find(i => i.id === dataPoint.indicatorId);
    const user = usersData.find(u => u.id === dataPoint.submittedBy);
    
    return {
      ...dataPoint,
      projectName: project?.name || 'Unknown Project',
      indicatorName: indicator?.name || 'Unknown Indicator',
      submittedByName: user?.name || 'Unknown User'
    };
  },

  async getByProjectId(projectId) {
    await delay(Math.random() * 600 + 200);
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const projectDataPoints = dataPointsData.filter(dp => dp.projectId === parseInt(projectId));
    
    const enrichedDataPoints = projectDataPoints.map(dataPoint => {
      const project = projectsData.find(p => p.id === dataPoint.projectId);
      const indicator = indicatorsData.find(i => i.id === dataPoint.indicatorId);
      const user = usersData.find(u => u.id === dataPoint.submittedBy);
      
      return {
        ...dataPoint,
        projectName: project?.name || 'Unknown Project',
        indicatorName: indicator?.name || 'Unknown Indicator',
        submittedByName: user?.name || 'Unknown User'
      };
    });
    
    return enrichedDataPoints;
  },

  async create(dataPointData) {
    await delay(Math.random() * 600 + 200);
    
    if (!dataPointData.projectId || !dataPointData.indicatorId || !dataPointData.value) {
      throw new Error('Project ID, Indicator ID, and value are required');
    }
    
    const newDataPoint = {
      id: Math.max(...dataPointsData.map(dp => dp.id)) + 1,
      ...dataPointData,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    return newDataPoint;
  },

  async update(id, dataPointData) {
    await delay(Math.random() * 600 + 200);
    
    const existingDataPoint = dataPointsData.find(dp => dp.id === parseInt(id));
    if (!existingDataPoint) {
      throw new Error(`Data point with id ${id} not found`);
    }
    
    const updatedDataPoint = {
      ...existingDataPoint,
      ...dataPointData,
      updatedAt: new Date().toISOString()
    };
    
    return updatedDataPoint;
  },

  async delete(id) {
    await delay(Math.random() * 400 + 100);
    
    const existingDataPoint = dataPointsData.find(dp => dp.id === parseInt(id));
    if (!existingDataPoint) {
      throw new Error(`Data point with id ${id} not found`);
    }
    
    return { success: true, message: 'Data point deleted successfully' };
  }
};

export { dataPointService };

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

  async getByProjectId(projectId) {
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
async approve(id, approverName = "System", feedback = "") {
    await delay(300);
    const existingItem = dataPointsData.find(item => item.Id === id);
    if (!existingItem) {
      throw new Error(`DataPoint with ID ${id} not found`);
    }
    
    const approvalData = {
      status: "approved",
      approvedBy: approverName,
      approvedAt: new Date().toISOString(),
      approvalWorkflow: "approved",
      feedback: feedback,
      auditTrail: [
        ...(existingItem.auditTrail || []),
        {
          action: "approved",
          timestamp: new Date().toISOString(),
          user: approverName,
          comment: feedback || "Data approved for dashboard integration"
        }
      ]
    };
    
    return this.update(id, approvalData);
  },

  async reject(id, reason = "", rejectorName = "System") {
    await delay(300);
    const existingItem = dataPointsData.find(item => item.Id === id);
    if (!existingItem) {
      throw new Error(`DataPoint with ID ${id} not found`);
    }
    
const rejectionData = {
      status: "draft", // Return to draft state for editing
      rejectedBy: rejectorName,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      approvalWorkflow: "rejected",
      feedback: reason,
      rejectionCount: (existingItem.rejectionCount || 0) + 1,
      auditTrail: [
        ...(existingItem.auditTrail || []),
        {
          action: "rejected",
          timestamp: new Date().toISOString(),
          user: rejectorName,
comment: reason || "Data rejected - requires revision"
        }
      ]
    };
    
    return this.update(id, rejectionData);
  },
// Get submissions pending review
async getPendingReview() {
    await delay(200);
    const pendingItems = dataPointsData.filter(item => 
      item.status === "submitted" || item.status === "in_review"
    );
    
    // Enrich with additional metadata for approval queue
    const enrichedItems = pendingItems.map(item => {
      const indicator = indicatorsData.find(ind => ind.Id === item.indicatorId);
      const project = projectsData.find(proj => proj.Id === item.projectId);
      const submitter = usersData.find(user => user.name === item.submittedBy);
      
      return {
        ...item,
        indicatorName: indicator?.name || "Unknown Indicator",
        indicatorUnit: indicator?.unit || "",
        indicatorType: indicator?.type || "",
        projectName: project?.name || "Unknown Project",
        countryName: project?.country || "Unknown Country",
        submitterRole: submitter?.role || "Unknown Role",
        priority: item.isRequired ? "high" : "medium",
        daysSinceSubmission: Math.floor((Date.now() - new Date(item.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      };
    });
    
    return enrichedItems;
  },

// Update submission status (for workflow management)
  async updateSubmissionStatus(id, status, additionalData = {}) {
    await delay(200);
    const index = dataPointsData.findIndex(item => item.Id === id);
    if (index === -1) {
      throw new Error(`DataPoint with ID ${id} not found`);
    }

    const currentItem = dataPointsData[index];
    const updatedData = {
      ...currentItem,
      status,
      approvalWorkflow: status,
      ...additionalData,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...(currentItem.auditTrail || []),
        {
          action: `status_change_to_${status}`,
          timestamp: new Date().toISOString(),
          user: additionalData.updatedBy || "System",
          comment: additionalData.comment || `Status changed to ${status}`
        }
      ]
    };

    dataPointsData[index] = updatedData;
    return { ...updatedData };
  },

  // Request changes (workflow step)
  async requestChanges(id, feedback, reviewerName = "System") {
    await delay(300);
    const existingItem = dataPointsData.find(item => item.Id === id);
    if (!existingItem) {
      throw new Error(`DataPoint with ID ${id} not found`);
    }
    
return this.updateSubmissionStatus(id, "draft", { // Return to draft for editing
      feedback: feedback,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toISOString(),
      updatedBy: reviewerName,
      comment: `Changes requested: ${feedback}`,
      changesRequestedCount: (existingItem.changesRequestedCount || 0) + 1,
      approvalWorkflow: "changes_requested" // Track workflow stage separately
    });
  },

  // Mark as in review
  async markInReview(id, reviewerName = "System") {
    await delay(200);
    return this.updateSubmissionStatus(id, "in_review", {
      reviewedBy: reviewerName,
      reviewStartedAt: new Date().toISOString(),
      updatedBy: reviewerName,
      comment: `Review started by ${reviewerName}`
    });
  },

  // Get approval statistics
  async getApprovalStats() {
    await delay(200);
    const stats = {
      total: dataPointsData.length,
      submitted: dataPointsData.filter(item => item.status === "submitted").length,
      inReview: dataPointsData.filter(item => item.status === "in_review").length,
      approved: dataPointsData.filter(item => item.status === "approved").length,
      rejected: dataPointsData.filter(item => item.status === "rejected").length,
      changesRequested: dataPointsData.filter(item => item.status === "changes_requested").length
    };
    
    stats.pendingReview = stats.submitted + stats.inReview;
    stats.processed = stats.approved + stats.rejected;
    stats.approvalRate = stats.total > 0 ? (stats.approved / stats.total * 100) : 0;
    
    return stats;
  },
async create(dataPointData) {
    await delay(400);
    const newId = Math.max(...dataPointsData.map(dp => dp.Id), 0) + 1;
    const newDataPoint = {
      Id: newId,
      submittedAt: new Date().toISOString(),
      status: "submitted", // Changed default to submitted for approval workflow
      approvedBy: null,
      approvalWorkflow: "submitted",
      qualityScore: dataPointData.qualityScore || 85,
      auditTrail: dataPointData.auditTrail || [],
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