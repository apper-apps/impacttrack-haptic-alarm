import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: {
    id: "1",
    name: "Anwesha MEL Lead",
    role: "Super Admin",
    email: "anwesha@goodreturn.org",
    countryId: null,
    permissions: ["all"]
  },
  selectedCountry: null,
  selectedProject: null,
  sidebarOpen: false,
  notifications: {
    items: [],
    loading: false,
    error: null,
    unreadCount: 0
  },
bulkImport: {
    loading: false,
    progress: 0,
    error: null
  },
dataEntry: {
    progress: {
      completed: 0,
      total: 0,
      assignedToUser: []
    },
    autoSave: {
      lastSaved: null,
      isDirty: false,
      interval: 30000 // 30 seconds
    },
    validation: {
      errors: {},
      isValid: true
    },
    draft: {}
  },
  approvalQueue: {
    items: [],
    loading: false,
    error: null,
    filters: {
      status: 'all',
      priority: 'all',
      submitter: 'all',
      dateRange: 'all'
    },
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  },
  validationRules: {
    rules: {},
    loading: false,
    error: null
  },
  qualityManagement: {
    scores: {},
    auditTrail: [],
    qualityThresholds: {
      high: 90,
      medium: 75,
      low: 60
    }
  },
reports: {
    queue: [],
    history: [],
    templates: {
      usage: {},
      lastGenerated: {}
    },
    analytics: {
      totalGenerated: 0,
      monthlyCount: 0,
      popularFormats: []
    },
    scheduled: {
      schedules: [],
      loading: false,
      error: null,
      activeCount: 3,
      totalRuns: 0,
      successRate: 98.5,
      nextRun: null
    }
  }
};

const melSlice = createSlice({
  name: "mel",
  initialState,
reducers: {
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
    },
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setNotificationsLoading: (state, action) => {
      state.notifications.loading = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications.items = action.payload;
      state.notifications.unreadCount = action.payload.filter(n => !n.isRead).length;
      state.notifications.loading = false;
      state.notifications.error = null;
    },
    setNotificationsError: (state, action) => {
      state.notifications.error = action.payload;
      state.notifications.loading = false;
    },
    updateNotification: (state, action) => {
      const index = state.notifications.items.findIndex(n => n.Id === action.payload.Id);
      if (index !== -1) {
        state.notifications.items[index] = action.payload;
        state.notifications.unreadCount = state.notifications.items.filter(n => !n.isRead).length;
      }
    },
    removeNotification: (state, action) => {
      state.notifications.items = state.notifications.items.filter(n => n.Id !== action.payload);
      state.notifications.unreadCount = state.notifications.items.filter(n => !n.isRead).length;
    },
    setBulkImportLoading: (state, action) => {
      state.bulkImport.loading = action.payload;
      if (!action.payload) {
        state.bulkImport.progress = 0;
      }
    },
    setBulkImportProgress: (state, action) => {
      state.bulkImport.progress = action.payload;
    },
    setBulkImportError: (state, action) => {
      state.bulkImport.error = action.payload;
      state.bulkImport.loading = false;
    },
clearBulkImportState: (state) => {
      state.bulkImport = {
        loading: false,
        progress: 0,
        error: null
      };
    },
    setDataEntryProgress: (state, action) => {
      state.dataEntry.progress = { ...state.dataEntry.progress, ...action.payload };
    },
    setDataEntryAutoSave: (state, action) => {
      state.dataEntry.autoSave = { ...state.dataEntry.autoSave, ...action.payload };
    },
    setDataEntryValidation: (state, action) => {
      state.dataEntry.validation = { ...state.dataEntry.validation, ...action.payload };
    },
    setDataEntryDraft: (state, action) => {
      state.dataEntry.draft = action.payload;
    },
    clearDataEntryState: (state) => {
      state.dataEntry = {
        progress: { completed: 0, total: 0, assignedToUser: [] },
        autoSave: { lastSaved: null, isDirty: false, interval: 30000 },
        validation: { errors: {}, isValid: true },
        draft: {}
};
    },
    // Real-time dashboard metric updates upon approval
updateDashboardMetrics: (state, action) => {
      const { metrics } = action.payload;
      state.dashboard = {
        ...state.dashboard,
        metrics: {
          ...state.dashboard?.metrics,
          ...metrics
        },
        lastUpdated: new Date().toISOString()
      };
    },
    refreshDashboardData: (state) => {
      state.dashboard = {
        ...state.dashboard,
        needsRefresh: true,
        lastRefreshTrigger: new Date().toISOString()
      };
    },
    setApprovalStatus: (state, action) => {
const { dataPointId, status, approvedBy, feedback } = action.payload;
      state.approvals = {
        ...state.approvals,
        [dataPointId]: {
          status,
          approvedBy: approvedBy || null,
          approvedAt: status === 'approved' ? new Date().toISOString() : null,
          rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
          feedback: feedback || null,
          workflowStage: status
        }
      };
    },
    // Approval Queue Management
    addToApprovalQueue: (state, action) => {
      const item = {
        ...action.payload,
        id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'submitted',
        addedAt: new Date().toISOString()
      };
      state.approvalQueue.items.unshift(item);
    },
    setApprovalQueueItems: (state, action) => {
      state.approvalQueue.items = action.payload;
    },
    updateApprovalQueueItem: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.approvalQueue.items.findIndex(item => item.id === id);
      if (index !== -1) {
        state.approvalQueue.items[index] = {
          ...state.approvalQueue.items[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    },
    removeFromApprovalQueue: (state, action) => {
      const id = action.payload;
      state.approvalQueue.items = state.approvalQueue.items.filter(item => item.id !== id);
    },
    setApprovalQueueFilters: (state, action) => {
      state.approvalQueue.filters = {
        ...state.approvalQueue.filters,
        ...action.payload
      };
    },
    setApprovalQueueSort: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.approvalQueue.sortBy = sortBy;
      state.approvalQueue.sortOrder = sortOrder;
    },
    setApprovalQueueLoading: (state, action) => {
      state.approvalQueue.loading = action.payload;
    },
    setApprovalQueueError: (state, action) => {
      state.approvalQueue.error = action.payload;
    },
    // Validation Rules Management
    setValidationRules: (state, action) => {
      state.validationRules.rules = action.payload;
    },
    updateValidationRule: (state, action) => {
      const { indicatorId, rules } = action.payload;
      state.validationRules.rules[indicatorId] = rules;
    },
    setValidationRulesLoading: (state, action) => {
      state.validationRules.loading = action.payload;
    },
    setValidationRulesError: (state, action) => {
      state.validationRules.error = action.payload;
    },
    // Quality Management
    setQualityScore: (state, action) => {
      const { dataPointId, score } = action.payload;
      state.qualityManagement.scores[dataPointId] = score;
    },
addAuditTrailEntry: (state, action) => {
      const entry = {
        ...action.payload,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metadata: {
          ...action.payload.metadata,
          workflowStage: action.payload.action,
          systemGenerated: false
        }
      };
      if (!state.qualityManagement.auditTrail) {
        state.qualityManagement.auditTrail = [];
      }
      state.qualityManagement.auditTrail.unshift(entry);
    },
    setQualityThresholds: (state, action) => {
      state.qualityManagement.qualityThresholds = {
        ...state.qualityManagement.qualityThresholds,
        ...action.payload
      };
    },
    setReportQueue: (state, action) => {
      const existingIndex = state.reports.queue.findIndex(r => r.id === action.payload.id);
      if (existingIndex !== -1) {
        state.reports.queue[existingIndex] = action.payload;
      } else {
        state.reports.queue.push(action.payload);
      }
    },
    updateReportProgress: (state, action) => {
      const { id, ...updates } = action.payload;
      const reportIndex = state.reports.queue.findIndex(r => r.id === id);
      if (reportIndex !== -1) {
        state.reports.queue[reportIndex] = { ...state.reports.queue[reportIndex], ...updates };
        
        // Remove from queue if completed
        if (updates.status === "completed") {
          state.reports.queue = state.reports.queue.filter(r => r.id !== id);
        }
      }
    },
    addReportToHistory: (state, action) => {
      state.reports.history.unshift(action.payload);
      state.reports.analytics.totalGenerated += 1;
      
      // Keep only last 50 reports
      if (state.reports.history.length > 50) {
        state.reports.history = state.reports.history.slice(0, 50);
      }
    },
    removeReportFromHistory: (state, action) => {
      state.reports.history = state.reports.history.filter(r => r.id !== action.payload);
    },
    updateTemplateUsage: (state, action) => {
      const { templateId, timestamp } = action.payload;
      state.reports.templates.usage[templateId] = (state.reports.templates.usage[templateId] || 0) + 1;
      state.reports.templates.lastGenerated[templateId] = timestamp;
    },
    clearReportsState: (state) => {
      state.reports = {
        queue: [],
        history: [],
        templates: { usage: {}, lastGenerated: {} },
        analytics: { totalGenerated: 0, monthlyCount: 0, popularFormats: [] }
      };
    }
  },
});

export const { 
  setSelectedCountry, 
  setSelectedProject, 
  toggleSidebar, 
  setSidebarOpen,
  setNotificationsLoading,
  setNotifications,
  setNotificationsError,
  updateNotification,
  removeNotification,
  setBulkImportLoading,
  setBulkImportProgress,
  setBulkImportError,
  clearBulkImportState,
  setDataEntryProgress,
  setDataEntryAutoSave,
  setDataEntryValidation,
  setDataEntryDraft,
  clearDataEntryState,
  setReportQueue,
  updateReportProgress,
  addReportToHistory,
  removeReportFromHistory,
  updateTemplateUsage,
  clearReportsState,
updateDashboardMetrics,
  refreshDashboardData,
  setApprovalStatus,
  addToApprovalQueue,
  setApprovalQueueItems,
  updateApprovalQueueItem,
  removeFromApprovalQueue,
  setApprovalQueueFilters,
  setApprovalQueueSort,
  setApprovalQueueLoading,
  setApprovalQueueError,
  setValidationRules,
  updateValidationRule,
  setValidationRulesLoading,
  setValidationRulesError,
  setQualityScore,
  addAuditTrailEntry,
  setQualityThresholds
} = melSlice.actions;
export default melSlice.reducer;