import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import Badge from "@/components/atoms/Badge";
import DataTable from "@/components/molecules/DataTable";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import { userService } from "@/services/api/userService";
import { indicatorService } from "@/services/api/indicatorService";

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    countryId: ""
  });

  const [addingUser, setAddingUser] = useState(false);

  const tabs = [
    { id: "users", label: "User Management", icon: "Users" },
    { id: "indicators", label: "Indicators", icon: "Target" },
    { id: "system", label: "System Settings", icon: "Settings" },
    { id: "notifications", label: "Notifications", icon: "Bell" }
  ];

  const roles = [
    { value: "Super Admin", label: "Super Admin" },
    { value: "Country Manager", label: "Country Manager" },
    { value: "Project Officer", label: "Project Officer" },
    { value: "Executive", label: "Executive" },
    { value: "External", label: "External" }
  ];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [usersData, indicatorsData] = await Promise.all([
        userService.getAll(),
        indicatorService.getAll()
      ]);
      
      setUsers(usersData);
      setIndicators(indicatorsData);
    } catch (err) {
      setError(err.message);
      console.error("Settings data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setAddingUser(true);
    try {
      const createdUser = await userService.create({
        ...newUser,
        countryId: newUser.countryId || null,
        permissions: newUser.role === "Super Admin" ? ["all"] : 
                    newUser.role === "Country Manager" ? ["data_entry", "view_country", "export_reports"] :
                    newUser.role === "Project Officer" ? ["data_entry", "view_project"] :
                    ["view_dashboard", "view_reports"]
      });
      
      setUsers(prev => [...prev, createdUser]);
      setNewUser({ name: "", email: "", role: "", countryId: "" });
      toast.success("User added successfully");
      
    } catch (err) {
      console.error("User creation error:", err);
      toast.error("Failed to add user");
    } finally {
      setAddingUser(false);
    }
  };

  const userColumns = [
    {
      key: "name",
      label: "Name",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{row.email}</div>
        </div>
      )
    },
    {
      key: "role",
      label: "Role",
      render: (value) => {
        const variant = value === "Super Admin" ? "primary" :
                      value === "Country Manager" ? "info" :
                      value === "Project Officer" ? "warning" :
                      value === "Executive" ? "success" : "default";
        return <Badge variant={variant}>{value}</Badge>;
      }
    },
    {
      key: "countryId",
      label: "Country",
      render: (value) => value ? `Country ID: ${value}` : "All Countries"
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (value) => value ? new Date(value).toLocaleDateString() : "Never"
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const variant = value === "active" ? "success" : "error";
        return <Badge variant={variant}>{value.charAt(0).toUpperCase() + value.slice(1)}</Badge>;
      }
    }
  ];

  const indicatorColumns = [
    {
      key: "name",
      label: "Indicator Name",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{row.description}</div>
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      render: (value) => <Badge variant="info">{value}</Badge>
    },
    {
      key: "type",
      label: "Type"
    },
    {
      key: "unit",
      label: "Unit"
    },
    {
      key: "target",
      label: "Target",
      type: "number"
    },
    {
      key: "frequency",
      label: "Frequency",
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    }
  ];

  if (loading) {
    return <Loading variant="skeleton" />;
  }

  if (error) {
    return (
      <Error 
        message={error} 
        onRetry={loadData}
        title="Failed to load settings"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage users, indicators, and system configuration</p>
        </div>
        <Button variant="outline">
          <ApperIcon name="Save" size={16} className="mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Card padding="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ApperIcon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add User Form */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <Input
                      label="Full Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                    
                    <Input
                      label="Email Address"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                    
                    <Select
                      label="Role"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                      options={roles}
                      required
                    />
                    
                    <Input
                      label="Country ID (Optional)"
                      value={newUser.countryId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, countryId: e.target.value }))}
                      placeholder="Leave blank for all countries"
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      loading={addingUser}
                    >
                      <ApperIcon name="Plus" size={16} className="mr-2" />
                      Add User
                    </Button>
                  </form>
                </div>

                {/* Users Table */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
                  <DataTable
                    data={users}
                    columns={userColumns}
                    emptyMessage="No users found"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Indicators Tab */}
          {activeTab === "indicators" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Performance Indicators</h3>
                <Button>
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Add Indicator
                </Button>
              </div>
              
              <DataTable
                data={indicators}
                columns={indicatorColumns}
                emptyMessage="No indicators configured"
              />
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h4 className="font-medium text-gray-900 mb-4">Data Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto-save Interval</div>
                        <div className="text-sm text-gray-600">How often to save draft data</div>
                      </div>
                      <Select
                        options={[
                          { value: "30", label: "30 seconds" },
                          { value: "60", label: "1 minute" },
                          { value: "300", label: "5 minutes" }
                        ]}
                        value="60"
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Data Retention</div>
                        <div className="text-sm text-gray-600">How long to keep historical data</div>
                      </div>
                      <Select
                        options={[
                          { value: "24", label: "2 years" },
                          { value: "36", label: "3 years" },
                          { value: "60", label: "5 years" }
                        ]}
                        value="36"
                        className="w-32"
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <h4 className="font-medium text-gray-900 mb-4">Reporting Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Report Format</div>
                        <div className="text-sm text-gray-600">Default format for generated reports</div>
                      </div>
                      <Select
                        options={[
                          { value: "pdf", label: "PDF" },
                          { value: "excel", label: "Excel" },
                          { value: "powerpoint", label: "PowerPoint" }
                        ]}
                        value="pdf"
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Currency Display</div>
                        <div className="text-sm text-gray-600">Default currency for financial data</div>
                      </div>
                      <Select
                        options={[
                          { value: "USD", label: "USD" },
                          { value: "EUR", label: "EUR" },
                          { value: "AUD", label: "AUD" }
                        ]}
                        value="USD"
                        className="w-32"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              
              <Card>
                <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  {[
                    { id: "data-submitted", label: "New data submitted for review", enabled: true },
                    { id: "data-approved", label: "Data approved by MEL Lead", enabled: true },
                    { id: "targets-missed", label: "Project targets missed", enabled: true },
                    { id: "reports-generated", label: "Reports generated successfully", enabled: false },
                    { id: "system-updates", label: "System updates and maintenance", enabled: true }
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{notification.label}</div>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          notification.enabled ? "bg-primary" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notification.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Settings;