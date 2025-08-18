import React from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const Empty = ({ 
  title = "No data available",
  message = "There's nothing to show here yet.",
  action,
  actionLabel = "Get started",
  icon = "Database",
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center mb-6">
        <ApperIcon name={icon} size={40} className="text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md">{message}</p>
      
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:brightness-110 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <ApperIcon name="Plus" size={16} className="inline mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Empty;