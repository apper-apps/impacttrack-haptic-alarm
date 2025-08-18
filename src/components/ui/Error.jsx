import React from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const Error = ({ 
  message = "Something went wrong", 
  onRetry, 
  className,
  title = "Error"
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-error/20 to-red-200 flex items-center justify-center mb-4">
        <ApperIcon name="AlertCircle" size={32} className="text-error" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:brightness-110 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <ApperIcon name="RefreshCw" size={16} className="inline mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default Error;