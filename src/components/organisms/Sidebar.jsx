import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { setSidebarOpen } from "@/store/melSlice";
import ApperIcon from "@/components/ApperIcon";
import { cn } from "@/utils/cn";

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen } = useSelector((state) => state.mel);
  const dispatch = useDispatch();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
      description: "Overview and KPIs"
    },
{
      name: "Submit Data",
      href: "/data-entry",
      icon: "PlusCircle",
      description: "Submit performance data"
    },
    {
      name: "Approval Queue",
      href: "/approval-queue",
      icon: "CheckSquare",
      description: "Review and approve data"
    },
    {
      name: "Projects",
      href: "/projects",
      icon: "FolderOpen",
      description: "Manage projects"
    },
    {
      name: "Reports",
      href: "/reports",
      icon: "FileText",
      description: "Generate reports"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: "TrendingUp",
      description: "AI insights"
    },
    {
      name: "Settings",
      href: "/settings",
      icon: "Settings",
      description: "System configuration"
    }
  ];

  const closeSidebar = () => {
    dispatch(setSidebarOpen(false));
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <ApperIcon name="Target" size={24} className="text-white" />
            </div>
            <div className="ml-3">
<h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Good Returns
              </h1>
              <p className="text-xs text-gray-600">MEL Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-l-4 border-primary" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                )}
              >
                <ApperIcon 
                  name={item.icon} 
                  size={20} 
                  className={cn(
                    "mr-3 transition-colors duration-200",
                    isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                  )} 
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={cn(
                    "text-xs transition-colors duration-200",
                    isActive ? "text-primary/70" : "text-gray-500"
                  )}>
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Check our documentation or contact support.
            </p>
            <button className="text-xs text-primary font-medium hover:text-secondary transition-colors">
              View Documentation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <ApperIcon name="Target" size={20} className="text-white" />
                  </div>
                  <div className="ml-3">
<h1 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Good Returns
                    </h1>
                    <p className="text-xs text-gray-600">MEL Platform</p>
                  </div>
                </div>
                <button
                  onClick={closeSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ApperIcon name="X" size={20} className="text-gray-600" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={closeSidebar}
                      className={cn(
                        "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-l-4 border-primary" 
                          : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                      )}
                    >
                      <ApperIcon 
                        name={item.icon} 
                        size={20} 
                        className={cn(
                          "mr-3 transition-colors duration-200",
                          isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
                        )} 
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className={cn(
                          "text-xs transition-colors duration-200",
                          isActive ? "text-primary/70" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;