import React from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import Card from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";

const ChartCard = ({ 
  title, 
  subtitle,
  chartData,
  chartOptions,
  type = "line",
  height = 300,
  loading = false,
  error = null,
  onRefresh,
  actions
}) => {
  const defaultOptions = {
    chart: {
      type,
      toolbar: {
        show: false
      },
      fontFamily: "Inter, system-ui, sans-serif"
    },
    colors: ["#667eea", "#764ba2", "#f59e0b", "#28a745"],
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4
    },
    xaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px"
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px"
        }
      }
    },
    legend: {
      position: "bottom",
      fontSize: "12px",
      fontFamily: "Inter, system-ui, sans-serif"
    },
    ...chartOptions
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ApperIcon name="AlertCircle" size={48} className="text-error mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-primary hover:text-secondary font-medium text-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center space-x-2">
            {actions}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <ApperIcon name="RefreshCw" size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div style={{ height }}>
          <Chart
            options={defaultOptions}
            series={chartData}
            type={type}
            height={height}
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default ChartCard;