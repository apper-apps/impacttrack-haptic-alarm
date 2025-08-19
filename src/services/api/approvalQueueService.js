import { dataPointService } from "./dataPointService";
import indicatorsData from "@/services/mockData/indicators.json";
import projectsData from "@/services/mockData/projects.json";
import usersData from "@/services/mockData/users.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const approvalQueueService = {
  async getApprovalQueue(filters = {}) {
    await delay(300);
    
    try {
      // Get pending items from dataPointService
      const pendingItems = await dataPointService.getPendingReview();
      
      // Apply additional filters
      let filteredItems = [...pendingItems];

      if (filters.status && filters.status !== 'all') {
        filteredItems = filteredItems.filter(item => item.status === filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        filteredItems = filteredItems.filter(item => item.priority === filters.priority);
      }

      if (filters.submitter && filters.submitter !== 'all') {
        filteredItems = filteredItems.filter(item => item.submittedBy === filters.submitter);
      }

      if (filters.qualityThreshold) {
        filteredItems = filteredItems.filter(item => 
          (item.qualityScore || 85) >= filters.qualityThreshold
        );
      }

      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        const daysCutoff = filters.dateRange === 'today' ? 1 : 
                          filters.dateRange === 'week' ? 7 : 30;
        
        filteredItems = filteredItems.filter(item => {
          const submissionDate = new Date(item.submittedAt);
          const diffTime = Math.abs(now - submissionDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= daysCutoff;
        });
      }

      // Sort items
      if (filters.sortBy) {
        filteredItems.sort((a, b) => {
          let aVal = a[filters.sortBy];
          let bVal = b[filters.sortBy];
          
          if (filters.sortBy === 'submittedAt' || filters.sortBy === 'reviewedAt') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }
          
          if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return filteredItems;
    } catch (error) {
      console.error("Error fetching approval queue:", error);
      throw new Error("Failed to load approval queue");
    }
  },

  async getApprovalStatistics() {
    await delay(200);
    
    try {
      const stats = await dataPointService.getApprovalStats();
      
      // Additional queue-specific metrics
      const pendingItems = await dataPointService.getPendingReview();
      
      const priorityBreakdown = {
        high: pendingItems.filter(item => item.priority === 'high').length,
        medium: pendingItems.filter(item => item.priority === 'medium').length,
        low: pendingItems.filter(item => item.priority === 'low').length
      };

      const qualityBreakdown = {
        excellent: pendingItems.filter(item => (item.qualityScore || 85) >= 90).length,
        good: pendingItems.filter(item => (item.qualityScore || 85) >= 75 && (item.qualityScore || 85) < 90).length,
        fair: pendingItems.filter(item => (item.qualityScore || 85) >= 60 && (item.qualityScore || 85) < 75).length,
        poor: pendingItems.filter(item => (item.qualityScore || 85) < 60).length
      };

      const avgResponseTime = this.calculateAverageResponseTime(pendingItems);
      const overdueItems = pendingItems.filter(item => item.daysSinceSubmission > 3).length;

      return {
        ...stats,
        priorityBreakdown,
        qualityBreakdown,
        avgResponseTime,
        overdueItems,
        avgQualityScore: pendingItems.length > 0 
          ? Math.round(pendingItems.reduce((sum, item) => sum + (item.qualityScore || 85), 0) / pendingItems.length)
          : 85
      };
    } catch (error) {
      console.error("Error fetching approval statistics:", error);
      throw new Error("Failed to load approval statistics");
    }
  },

  async bulkApprove(itemIds, approverName, feedback = "") {
    await delay(500);
    
    try {
      const results = [];
      
      for (const itemId of itemIds) {
        try {
          const result = await dataPointService.approve(itemId, approverName, feedback);
          results.push({ itemId, success: true, result });
        } catch (error) {
          results.push({ itemId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        totalProcessed: itemIds.length,
        successCount,
        failureCount,
        results
      };
    } catch (error) {
      console.error("Error in bulk approval:", error);
      throw new Error("Failed to process bulk approval");
    }
  },

  async bulkReject(itemIds, rejectorName, reason) {
    await delay(500);
    
    try {
      const results = [];
      
      for (const itemId of itemIds) {
        try {
          const result = await dataPointService.reject(itemId, reason, rejectorName);
          results.push({ itemId, success: true, result });
        } catch (error) {
          results.push({ itemId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        totalProcessed: itemIds.length,
        successCount,
        failureCount,
        results
      };
    } catch (error) {
      console.error("Error in bulk rejection:", error);
      throw new Error("Failed to process bulk rejection");
    }
  },

  async getApprovalHistory(dataPointId) {
    await delay(200);
    
    try {
      const dataPoint = await dataPointService.getById(dataPointId);
      
      if (!dataPoint) {
        throw new Error("Data point not found");
      }

      // Return audit trail with enriched information
      const history = (dataPoint.auditTrail || []).map(entry => ({
        ...entry,
        userRole: usersData.find(u => u.name === entry.user)?.role || "Unknown",
        actionType: this.categorizeAction(entry.action),
        duration: this.calculateActionDuration(entry.timestamp, dataPoint.auditTrail)
      }));

      return {
        dataPointId,
        indicatorName: indicatorsData.find(i => i.Id === dataPoint.indicatorId)?.name || "Unknown",
        currentStatus: dataPoint.status,
        history: history.reverse() // Most recent first
      };
    } catch (error) {
      console.error("Error fetching approval history:", error);
      throw new Error("Failed to load approval history");
    }
  },

  async getQueueInsights() {
    await delay(250);
    
    try {
      const pendingItems = await dataPointService.getPendingReview();
      
      // Bottleneck analysis
      const submitterLoad = {};
      const indicatorLoad = {};
      
      pendingItems.forEach(item => {
        submitterLoad[item.submittedBy] = (submitterLoad[item.submittedBy] || 0) + 1;
        indicatorLoad[item.indicatorName] = (indicatorLoad[item.indicatorName] || 0) + 1;
      });

      // Identify bottlenecks
      const topSubmitters = Object.entries(submitterLoad)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      const topIndicators = Object.entries(indicatorLoad)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Time-based insights
      const timeAnalysis = this.analyzeSubmissionTimes(pendingItems);
      
      // Quality trends
      const qualityTrend = this.analyzeQualityTrend(pendingItems);

      return {
        bottlenecks: {
          topSubmitters,
          topIndicators
        },
        timeAnalysis,
        qualityTrend,
        recommendations: this.generateQueueRecommendations(pendingItems, submitterLoad, indicatorLoad)
      };
    } catch (error) {
      console.error("Error generating queue insights:", error);
      throw new Error("Failed to generate queue insights");
    }
  },

  // Helper methods
  calculateAverageResponseTime(items) {
    const processedItems = items.filter(item => item.reviewedAt);
    if (processedItems.length === 0) return 0;

    const totalTime = processedItems.reduce((sum, item) => {
      const submitted = new Date(item.submittedAt);
      const reviewed = new Date(item.reviewedAt);
      return sum + (reviewed - submitted);
    }, 0);

    return Math.round(totalTime / processedItems.length / (1000 * 60 * 60 * 24)); // days
  },

  categorizeAction(action) {
    if (action.includes('submit')) return 'submission';
    if (action.includes('approve')) return 'approval';
    if (action.includes('reject')) return 'rejection';
    if (action.includes('review')) return 'review';
    if (action.includes('change')) return 'modification';
    return 'other';
  },

  calculateActionDuration(timestamp, auditTrail) {
    const actionTime = new Date(timestamp);
    const nextAction = auditTrail.find(entry => new Date(entry.timestamp) > actionTime);
    
    if (nextAction) {
      const nextTime = new Date(nextAction.timestamp);
      return Math.round((nextTime - actionTime) / (1000 * 60 * 60)); // hours
    }
    
    return Math.round((Date.now() - actionTime) / (1000 * 60 * 60)); // hours since action
  },

  analyzeSubmissionTimes(items) {
    const hourCounts = new Array(24).fill(0);
    
    items.forEach(item => {
      const hour = new Date(item.submittedAt).getHours();
      hourCounts[hour]++;
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      peakHours,
      totalSubmissions: items.length,
      avgPerHour: Math.round(items.length / 24 * 10) / 10
    };
  },

  analyzeQualityTrend(items) {
    const sortedItems = [...items].sort((a, b) => 
      new Date(a.submittedAt) - new Date(b.submittedAt)
    );

    if (sortedItems.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const firstHalf = sortedItems.slice(0, Math.floor(sortedItems.length / 2));
    const secondHalf = sortedItems.slice(Math.floor(sortedItems.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + (item.qualityScore || 85), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + (item.qualityScore || 85), 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    let trend = 'stable';
    
    if (change > 5) trend = 'improving';
    else if (change < -5) trend = 'declining';

    return { trend, change: Math.round(change * 10) / 10 };
  },

  generateQueueRecommendations(items, submitterLoad, indicatorLoad) {
    const recommendations = [];

    // High load submitters
    const highLoadSubmitters = Object.entries(submitterLoad).filter(([, count]) => count > 10);
    if (highLoadSubmitters.length > 0) {
      recommendations.push({
        type: 'capacity',
        priority: 'high',
        message: `${highLoadSubmitters.length} submitters have high pending volumes. Consider additional review capacity.`,
        action: 'Allocate more reviewers or implement batch processing'
      });
    }

    // Quality issues
    const lowQualityItems = items.filter(item => (item.qualityScore || 85) < 70).length;
    if (lowQualityItems > items.length * 0.3) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: `${lowQualityItems} items have low quality scores. Data entry training may be needed.`,
        action: 'Implement validation training for high-volume submitters'
      });
    }

    // Overdue items
    const overdueItems = items.filter(item => item.daysSinceSubmission > 3).length;
    if (overdueItems > 0) {
      recommendations.push({
        type: 'timeliness',
        priority: 'high',
        message: `${overdueItems} items are overdue for review. SLA targets may be at risk.`,
        action: 'Prioritize overdue items and review approval workflow efficiency'
      });
    }

    return recommendations;
  }
};

export default approvalQueueService;