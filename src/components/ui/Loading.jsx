import React from "react";
import { cn } from "@/utils/cn";

const Loading = ({ className, variant = "default" }) => {
  if (variant === "skeleton") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                <div className="h-8 bg-gradient-to-r from-primary/20 to-secondary/20 rounded mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="ml-3 text-gray-600 font-medium">Loading...</div>
    </div>
  );
};

export default Loading;