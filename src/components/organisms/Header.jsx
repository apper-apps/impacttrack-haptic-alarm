import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/store/melSlice";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import CountrySelector from "@/components/molecules/CountrySelector";

const Header = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.mel);

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden"
          >
            <ApperIcon name="Menu" size={20} />
          </Button>
          
          <div className="hidden sm:block">
            <nav className="flex space-x-2 text-sm text-gray-600">
              <span>Good Return</span>
              <ApperIcon name="ChevronRight" size={16} />
              <span className="text-gray-900 font-medium">MEL Platform</span>
            </nav>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <CountrySelector />
          
          <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
              <div className="text-xs text-gray-600">{currentUser.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <ApperIcon name="User" size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;