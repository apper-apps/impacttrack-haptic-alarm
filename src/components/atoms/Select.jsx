import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Select = forwardRef(({ 
  options = [],
  label, 
  error, 
  placeholder = "Select option...",
  className,
  containerClassName,
  ...props 
}, ref) => {
  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200",
          error && "border-error focus:border-error focus:ring-error/50",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-error font-medium">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";

export default Select;