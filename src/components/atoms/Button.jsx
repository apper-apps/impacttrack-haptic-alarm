import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Button = forwardRef(({ 
  children, 
  variant = "primary", 
  size = "md", 
  className, 
  disabled,
  loading,
  ...props 
}, ref) => {
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    outline: "border border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-gray-700 hover:bg-gray-100",
    danger: "bg-gradient-to-r from-error to-red-500 text-white hover:brightness-110"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;