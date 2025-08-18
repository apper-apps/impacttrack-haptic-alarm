import React from "react";
import { useSelector } from "react-redux";
import DashboardGrid from "@/components/organisms/DashboardGrid";
import ApperIcon from "@/components/ApperIcon";

const Dashboard = () => {
  const { currentUser, selectedCountry } = useSelector((state) => state.mel);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getContextTitle = () => {
    if (selectedCountry) {
      const countryNames = {
        cambodia: "Cambodia",
        philippines: "Philippines",
        "solomon-islands": "Solomon Islands",
        samoa: "Samoa",
        tonga: "Tonga",
        fiji: "Fiji",
        "timor-leste": "Timor-Leste",
        indonesia: "Indonesia",
        png: "Papua New Guinea",
        myanmar: "Myanmar"
      };
      return `${countryNames[selectedCountry] || selectedCountry} Overview`;
    }
    return "Global Overview";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="text-primary-100 text-lg">
              {getContextTitle()}
            </p>
            <div className="flex items-center mt-4 space-x-6">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Calendar" size={16} className="text-primary-200" />
                <span className="text-sm text-primary-100">
                  {new Date().toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="Clock" size={16} className="text-primary-200" />
                <span className="text-sm text-primary-100">Q1 2024 Reporting Period</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">10</div>
              <div className="text-xs text-primary-200">Countries</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">25</div>
              <div className="text-xs text-primary-200">Projects</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">3.5M</div>
              <div className="text-xs text-primary-200">Target Reach</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific Context */}
      {currentUser.role === "Super Admin" && (
        <div className="bg-white rounded-xl p-4 border-l-4 border-primary shadow-sm">
          <div className="flex items-center">
            <ApperIcon name="Shield" size={20} className="text-primary mr-3" />
            <div>
              <p className="font-medium text-gray-900">Administrator View</p>
              <p className="text-sm text-gray-600">
                You have full access to all countries and data. {selectedCountry ? "Viewing filtered data." : "Showing global data."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <DashboardGrid />
    </div>
  );
};

export default Dashboard;