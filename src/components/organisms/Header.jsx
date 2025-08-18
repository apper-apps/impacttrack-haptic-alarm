import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSidebar, setNotificationsLoading, setNotifications, setNotificationsError } from "@/store/melSlice";
import { notificationService } from "@/services/api/notificationService";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import CountrySelector from "@/components/molecules/CountrySelector";
const Header = () => {
  const dispatch = useDispatch();
const { currentUser, notifications } = useSelector((state) => state.mel);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        dispatch(setNotificationsLoading(true));
        const data = await notificationService.getAll();
        dispatch(setNotifications(data));
      } catch (error) {
        dispatch(setNotificationsError(error.message));
      }
    };

    fetchNotifications();
  }, [dispatch]);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

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
          
          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotificationClick}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <ApperIcon name="Bell" size={20} className="text-gray-600" />
              {notifications.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                </span>
              )}
            </Button>
          </div>
          
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