import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Badge = forwardRef(({ 
  children, 
  variant = "default", 
  size = "md",
  className, 
  ...props 
}, ref) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary",
    success: "bg-gradient-to-r from-success/20 to-green-200 text-success",
    warning: "bg-gradient-to-r from-warning/20 to-yellow-200 text-warning",
    error: "bg-gradient-to-r from-error/20 to-red-200 text-error",
    info: "bg-gradient-to-r from-info/20 to-blue-200 text-info"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = "Badge";

export default Badge;