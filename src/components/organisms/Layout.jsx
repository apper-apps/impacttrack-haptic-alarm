import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/organisms/Sidebar";
import Header from "@/components/organisms/Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header />
        
        <main className="py-6 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;