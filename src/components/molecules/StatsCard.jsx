import React from "react";
import { motion } from "framer-motion";
import Card from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "positive",
  icon, 
  gradient,
  unit = ""
}) => {
  const changeColors = {
    positive: "text-success",
    negative: "text-error",
    neutral: "text-gray-600"
  };

  const formatValue = (val) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {formatValue(value)}
              </p>
              {unit && (
                <span className="ml-1 text-lg text-gray-500">{unit}</span>
              )}
            </div>
            {change && (
              <div className="flex items-center mt-2">
                <ApperIcon 
                  name={changeType === "positive" ? "TrendingUp" : "TrendingDown"} 
                  size={16} 
                  className={changeColors[changeType]} 
                />
                <span className={`ml-1 text-sm font-medium ${changeColors[changeType]}`}>
                  {change}
                </span>
                <span className="ml-1 text-sm text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
            <ApperIcon name={icon} size={24} className="text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatsCard;