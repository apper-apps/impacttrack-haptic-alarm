import React from "react";
import { motion } from "framer-motion";

const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  title, 
  subtitle,
  color = "#667eea"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{progress}%</div>
          </div>
        </div>
      </div>
      {title && (
        <div className="mt-3 text-center">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-600">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;