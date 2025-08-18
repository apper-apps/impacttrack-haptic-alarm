import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Input = forwardRef(({ 
  type = "text", 
  label, 
  error, 
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
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200",
          error && "border-error focus:border-error focus:ring-error/50",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;