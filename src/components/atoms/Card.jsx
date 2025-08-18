import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Card = forwardRef(({ 
  children, 
  className, 
  padding = "p-6",
  hover = false,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200",
        hover && "hover:shadow-md hover:-translate-y-1",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export default Card;