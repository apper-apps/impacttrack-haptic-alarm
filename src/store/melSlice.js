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
  sidebarOpen: false
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
    }
  },
});

export const { setSelectedCountry, setSelectedProject, toggleSidebar, setSidebarOpen } = melSlice.actions;
export default melSlice.reducer;