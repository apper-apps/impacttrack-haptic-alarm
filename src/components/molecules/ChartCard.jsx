import React from "react";
import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import ApperIcon from "@/components/ApperIcon";
import Card from "@/components/atoms/Card";

export default function ChartCard({ title, subtitle, data, type = 'line', ...props }) {
  // Validate chart data before rendering
  const hasValidData = data && data.series && Array.isArray(data.series) && data.series.length > 0;
  const chartOptions = data?.options || {};
  const chartSeries = hasValidData ? data.series : [];

  if (!hasValidData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <ApperIcon name="BarChart3" className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No chart data available</p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="mt-4">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type={type}
            height={chartOptions.chart?.height || 300}
          />
        </div>
      </Card>
</motion.div>
  );
}