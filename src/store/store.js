import { configureStore } from "@reduxjs/toolkit";
import melSlice from "@/store/melSlice";

export const store = configureStore({
  reducer: {
    mel: melSlice,
  },
});