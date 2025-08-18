import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Projects from "@/components/pages/Projects";
import DataEntry from "@/components/pages/DataEntry";
import Dashboard from "@/components/pages/Dashboard";
import Settings from "@/components/pages/Settings";
import Analytics from "@/components/pages/Analytics";
import Reports from "@/components/pages/Reports";
import NotificationCenter from "@/components/pages/NotificationCenter";
import Layout from "@/components/organisms/Layout";

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
<Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="data-entry" element={<DataEntry />} />
            <Route path="projects" element={<Projects />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;