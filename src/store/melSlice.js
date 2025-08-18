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
  clearBulkImportState
} = melSlice.actions;
export default melSlice.reducer;