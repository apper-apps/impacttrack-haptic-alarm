import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApprovalQueue from "@/components/pages/ApprovalQueue";
import CountryDetail from "@/components/pages/CountryDetail";
import Projects from "@/components/pages/Projects";
import ProjectDetail from "@/components/pages/ProjectDetail";
import DataEntry from "@/components/pages/DataEntry";
import Countries from "@/components/pages/Countries";
import Dashboard from "@/components/pages/Dashboard";
import BulkImport from "@/components/pages/BulkImport";
import Settings from "@/components/pages/Settings";
import Analytics from "@/components/pages/Analytics";
import Reports from "@/components/pages/Reports";
import NotificationCenter from "@/components/pages/NotificationCenter";
import Layout from "@/components/organisms/Layout";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout />}>
<Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="data-entry" element={<DataEntry />} />
            <Route path="approval-queue" element={<ApprovalQueue />} />
            <Route path="bulk-import" element={<BulkImport />} />
<Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="countries" element={<Countries />} />
            <Route path="countries/:id" element={<CountryDetail />} />
<Route path="reports" element={<Reports />} />
            <Route path="reports/scheduled" element={<Reports />} />
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