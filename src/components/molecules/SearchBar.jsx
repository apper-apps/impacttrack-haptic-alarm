import React from "react";
import ApperIcon from "@/components/ApperIcon";

const SearchBar = ({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "",
  onClear,
  showClear = true
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <ApperIcon 
        name="Search" 
        size={20} 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200"
      />
      {showClear && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ApperIcon name="X" size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;