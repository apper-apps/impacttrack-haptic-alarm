import React, { useState } from "react";
import ApperIcon from "@/components/ApperIcon";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";

const DataTable = ({ 
  data = [],
  columns = [],
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  sortable = true,
  filterable = true
}) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterText, setFilterText] = useState("");

  // Filter data
  const filteredData = data.filter(row =>
    Object.values(row).some(value => 
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === bVal) return 0;
    
    const result = aVal < bVal ? -1 : 1;
    return sortDirection === "asc" ? result : -result;
  });

  const handleSort = (field) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

const renderCellValue = (value, column, row) => {
    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === "badge") {
      const variant = column.badgeVariant?.(value) || "default";
      return <Badge variant={variant}>{value}</Badge>;
    }

    if (column.type === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
      }).format(value);
    }

    if (column.type === "number") {
      return typeof value === "number" ? value.toLocaleString() : value;
    }

    if (column.type === "percentage") {
      return `${value}%`;
    }

    return value;
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {filterable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <ApperIcon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-900 ${
                    sortable && column.sortable !== false ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && sortField === column.key && (
                      <ApperIcon 
                        name={sortDirection === "asc" ? "ChevronUp" : "ChevronDown"} 
                        size={14} 
                        className="text-primary" 
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  <ApperIcon name="Database" size={48} className="mx-auto text-gray-300 mb-4" />
                  <div className="text-lg font-medium mb-2">No Data Found</div>
                  <div className="text-sm">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={row.Id || index}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
<td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                      {renderCellValue(row[column.key], column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Showing {sortedData.length} of {data.length} entries
          {filterText && (
            <span className="ml-2">
              (filtered from {data.length} total)
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default DataTable;