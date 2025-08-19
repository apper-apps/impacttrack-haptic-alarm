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
      const { dataPointId, status, approvedBy } = action.payload;
      state.approvals = {
        ...state.approvals,
        [dataPointId]: {
          status,
          approvedBy,
          approvedAt: new Date().toISOString()
        }
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
  setApprovalStatus
} = melSlice.actions;
export default melSlice.reducer;