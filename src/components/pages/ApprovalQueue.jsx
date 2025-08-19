import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { dataPointService } from '@/services/api/dataPointService';
import { indicatorService } from '@/services/api/indicatorService';
import ApperIcon from '@/components/ApperIcon';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import DataTable from '@/components/molecules/DataTable';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import {
  setApprovalQueueItems,
  setApprovalQueueLoading,
  setApprovalQueueError,
  setApprovalQueueFilters,
  setApprovalQueueSort,
  updateApprovalQueueItem,
  removeFromApprovalQueue,
  addAuditTrailEntry,
  updateDashboardMetrics,
  refreshDashboardData
} from '@/store/melSlice';

const ApprovalQueue = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.mel);
  const { items, loading, error, filters, sortBy, sortOrder } = useSelector((state) => state.mel.approvalQueue);
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [qualityThreshold, setQualityThreshold] = useState(75);

  // Load approval queue data
  useEffect(() => {
    loadApprovalQueue();
  }, [dispatch]);

  const loadApprovalQueue = async () => {
    try {
      dispatch(setApprovalQueueLoading(true));
      const pendingData = await dataPointService.getPendingReview();
      dispatch(setApprovalQueueItems(pendingData));
    } catch (err) {
      dispatch(setApprovalQueueError(err.message));
      toast.error("Failed to load approval queue");
    } finally {
      dispatch(setApprovalQueueLoading(false));
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }
    
    if (filters.submitter !== 'all') {
      filtered = filtered.filter(item => item.submittedBy === filters.submitter);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const daysCutoff = filters.dateRange === 'today' ? 1 : 
                        filters.dateRange === 'week' ? 7 : 30;
      
      filtered = filtered.filter(item => {
        const submissionDate = new Date(item.submittedAt);
        const diffTime = Math.abs(now - submissionDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= daysCutoff;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'submittedAt' || sortBy === 'reviewedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, filters, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const submitted = items.filter(item => item.status === 'submitted').length;
    const inReview = items.filter(item => item.status === 'in_review').length;
    const highPriority = items.filter(item => item.priority === 'high').length;
    const lowQuality = items.filter(item => item.qualityScore < qualityThreshold).length;
    const avgQuality = items.length > 0 
      ? items.reduce((sum, item) => sum + (item.qualityScore || 85), 0) / items.length 
      : 0;

    return { total, submitted, inReview, highPriority, lowQuality, avgQuality };
  }, [items, qualityThreshold]);

  // Handle individual item actions
  const handleReviewItem = async (item) => {
    setReviewItem(item);
    setFeedback('');
    
    // Load comparison data
    try {
      const allData = await dataPointService.getAll();
      const previousPeriodData = allData.filter(dp => 
        dp.indicatorId === item.indicatorId &&
        dp.projectId === item.projectId &&
        dp.period !== item.period &&
        dp.status === 'approved'
      ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      
      setComparisonData({
        previousPeriod: previousPeriodData[0] || null,
        historicalAvg: previousPeriodData.length > 0 
          ? previousPeriodData.reduce((sum, dp) => sum + dp.value, 0) / previousPeriodData.length
          : null
      });
    } catch (err) {
      console.error("Error loading comparison data:", err);
    }
    
    setReviewModalOpen(true);
  };

  const handleApprove = async (item, approvalFeedback = '') => {
    try {
      await dataPointService.approve(item.Id, currentUser.name, approvalFeedback);
      
      dispatch(updateApprovalQueueItem({
        id: item.id,
        updates: {
          status: 'approved',
          approvedBy: currentUser.name,
          approvedAt: new Date().toISOString(),
          feedback: approvalFeedback
        }
      }));

      dispatch(addAuditTrailEntry({
        dataPointId: item.Id,
        action: 'approved',
        user: currentUser.name,
        comment: approvalFeedback || 'Data approved for dashboard integration'
      }));

      // Update dashboard metrics
      dispatch(updateDashboardMetrics({
        totalPeopleReached: item.value,
        lastApproval: {
          timestamp: new Date().toISOString(),
          approver: currentUser.name,
          value: item.value
        }
      }));
      
      dispatch(refreshDashboardData());
      
      toast.success(`${item.indicatorName} approved successfully!`);
      
      // Remove from queue after delay to show success
      setTimeout(() => {
        dispatch(removeFromApprovalQueue(item.id));
      }, 1000);
    } catch (err) {
      toast.error("Failed to approve item");
    }
  };

  const handleReject = async (item, rejectionReason) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

try {
      await dataPointService.reject(item.Id, rejectionReason, currentUser.name);
      dispatch(updateApprovalQueueItem({
        id: item.id,
        updates: {
          status: 'rejected',
          rejectedBy: currentUser.name,
          rejectedAt: new Date().toISOString(),
          feedback: rejectionReason
        }
      }));
dispatch(addAuditTrailEntry({
        dataPointId: item.Id,
        action: 'rejected',
        user: currentUser.name,
        comment: rejectionReason,
        metadata: {
          indicatorName: item.indicatorName,
          value: item.value,
          qualityScore: item.qualityScore
        }
      }));

      toast.success("Data rejected and feedback sent to submitter");
      
      setTimeout(() => {
        dispatch(removeFromApprovalQueue(item.id));
      }, 1000);
    } catch (err) {
      toast.error("Failed to reject item");
    }
  };

  const handleRequestChanges = async (item, changeRequests) => {
    if (!changeRequests.trim()) {
      toast.error("Please specify what changes are needed");
      return;
    }

    try {
      await dataPointService.requestChanges(item.Id, changeRequests, currentUser.name);
      
      dispatch(updateApprovalQueueItem({
        id: item.id,
        updates: {
          status: 'changes_requested',
          reviewedBy: currentUser.name,
          reviewedAt: new Date().toISOString(),
          feedback: changeRequests
        }
      }));

      dispatch(addAuditTrailEntry({
        dataPointId: item.Id,
        action: 'changes_requested',
        user: currentUser.name,
        comment: changeRequests
      }));

      toast.success("Change requests sent to submitter");
      
      setTimeout(() => {
        dispatch(removeFromApprovalQueue(item.id));
      }, 1000);
    } catch (err) {
      toast.error("Failed to request changes");
    }
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to approve");
      return;
    }

    const highQualityItems = selectedItems.filter(id => {
      const item = items.find(i => i.id === id);
      return item && (item.qualityScore || 85) >= qualityThreshold;
    });

    if (highQualityItems.length !== selectedItems.length) {
      const confirmed = window.confirm(
        `${selectedItems.length - highQualityItems.length} items have quality scores below ${qualityThreshold}%. Continue with bulk approval?`
      );
      if (!confirmed) return;
    }

    try {
      const promises = selectedItems.map(id => {
        const item = items.find(i => i.id === id);
        return handleApprove(item, `Bulk approval by ${currentUser.name}`);
      });
      
      await Promise.all(promises);
      setSelectedItems([]);
      setBulkActionMode(false);
      toast.success(`${selectedItems.length} items approved successfully!`);
    } catch (err) {
      toast.error("Some items failed to approve");
    }
  };

  // Data table configuration
  const columns = [
    {
      key: 'select',
      label: bulkActionMode ? 'Select' : '',
      sortable: false,
      render: (_, item) => bulkActionMode ? (
        <input
          type="checkbox"
          checked={selectedItems.includes(item.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedItems([...selectedItems, item.id]);
            } else {
              setSelectedItems(selectedItems.filter(id => id !== item.id));
            }
          }}
          className="w-4 h-4"
        />
      ) : null
    },
    {
      key: 'indicatorName',
      label: 'Indicator',
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{item.projectName}</div>
          <div className="text-xs text-gray-400">{item.countryName}</div>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Value',
      render: (value, item) => (
        <div className="text-center">
          <div className="font-semibold text-lg">{value.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{item.indicatorUnit}</div>
{item.varianceFromPrevious != null && typeof item.varianceFromPrevious === 'number' && (
            <div className={`text-xs ${Math.abs(item.varianceFromPrevious) > 20 ? 'text-orange-600' : 'text-gray-600'}`}>
              {item.varianceFromPrevious > 0 ? '+' : ''}{item.varianceFromPrevious.toFixed(1)}%
            </div>
          )}
        </div>
      )
    },
    {
      key: 'qualityScore',
      label: 'Quality',
      render: (score, item) => {
        const qualityScore = score || 85;
        return (
          <div className="text-center">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              qualityScore >= 90 ? 'bg-success text-white' :
              qualityScore >= 75 ? 'bg-info text-white' :
              qualityScore >= 60 ? 'bg-warning text-white' :
              'bg-error text-white'
            }`}>
              {qualityScore}%
            </div>
          </div>
        );
      }
    },
    {
      key: 'submittedBy',
      label: 'Submitter',
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{item.submitterRole}</div>
          <div className="text-xs text-gray-400">
            {format(parseISO(item.submittedAt), 'MMM d, HH:mm')}
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (priority) => (
        <Badge variant={priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'default'}>
          {priority}
        </Badge>
      )
    },
    {
      key: 'daysSinceSubmission',
      label: 'Days Pending',
      render: (days) => (
        <div className={`text-center ${days > 3 ? 'text-error' : days > 1 ? 'text-warning' : 'text-gray-600'}`}>
          {days} day{days !== 1 ? 's' : ''}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, item) => (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleReviewItem(item)}
            className="text-info hover:bg-info/10"
          >
            <ApperIcon name="Eye" size={16} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleApprove(item)}
            className="text-success hover:bg-success/10"
          >
            <ApperIcon name="Check" size={16} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              const reason = prompt("Reason for rejection:");
              if (reason) handleReject(item, reason);
            }}
            className="text-error hover:bg-error/10"
          >
            <ApperIcon name="X" size={16} />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadApprovalQueue} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-gray-600">Review and approve submitted data for dashboard integration</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={bulkActionMode ? "default" : "ghost"}
            onClick={() => setBulkActionMode(!bulkActionMode)}
          >
            <ApperIcon name="CheckSquare" size={16} className="mr-2" />
            Bulk Actions
          </Button>
          <Button onClick={loadApprovalQueue} variant="ghost">
            <ApperIcon name="RefreshCw" size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Pending</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-warning">{stats.submitted}</div>
          <div className="text-sm text-gray-600">Submitted</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-info">{stats.inReview}</div>
          <div className="text-sm text-gray-600">In Review</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-error">{stats.highPriority}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.lowQuality}</div>
          <div className="text-sm text-gray-600">Low Quality</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">{stats.avgQuality.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Avg Quality</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
<Select
            value={filters.status}
            onChange={(value) => dispatch(setApprovalQueueFilters({ status: value }))}
            options={[
              { value: "all", label: "All Status" },
              { value: "submitted", label: "Submitted" },
              { value: "in_review", label: "In Review" }
            ]}
          />
          
<Select
            value={filters.priority}
            onChange={(value) => dispatch(setApprovalQueueFilters({ priority: value }))}
            options={[
              { value: "all", label: "All Priorities" },
              { value: "high", label: "High Priority" },
              { value: "medium", label: "Medium Priority" },
              { value: "low", label: "Low Priority" }
            ]}
          />

<Select
            value={filters.dateRange}
            onChange={(value) => dispatch(setApprovalQueueFilters({ dateRange: value }))}
            options={[
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" }
            ]}
          />

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Quality Threshold:</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={qualityThreshold}
              onChange={(e) => setQualityThreshold(Number(e.target.value))}
              className="w-20"
            />
          </div>

          {bulkActionMode && selectedItems.length > 0 && (
            <Button onClick={handleBulkApprove} className="bg-success hover:bg-success/90">
              <ApperIcon name="Check" size={16} className="mr-2" />
              Approve {selectedItems.length} Items
            </Button>
          )}
        </div>
      </Card>

      {/* Data Table */}
      <DataTable
        data={filteredAndSortedItems}
        columns={columns}
        loading={loading}
        emptyMessage="No items pending approval"
        sortable={true}
        onRowClick={!bulkActionMode ? handleReviewItem : undefined}
      />

      {/* Review Modal */}
      {reviewModalOpen && reviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Review Data Submission</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                >
                  <ApperIcon name="X" size={20} />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Submission */}
                <div>
                  <h3 className="font-semibold mb-4">Current Submission</h3>
                  <div className="space-y-4 bg-blue-50 p-4 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Indicator:</span>
                      <span className="font-medium">{reviewItem.indicatorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-bold text-lg">{reviewItem.value.toLocaleString()} {reviewItem.indicatorUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted by:</span>
                      <span>{reviewItem.submittedBy} ({reviewItem.submitterRole})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality Score:</span>
                      <Badge variant={reviewItem.qualityScore >= 80 ? "success" : reviewItem.qualityScore >= 60 ? "warning" : "error"}>
                        {reviewItem.qualityScore || 85}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span>{format(parseISO(reviewItem.submittedAt), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison Data */}
                <div>
                  <h3 className="font-semibold mb-4">Previous Period Comparison</h3>
                  {comparisonData?.previousPeriod ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Previous Value:</span>
                        <span className="font-medium">{comparisonData.previousPeriod.value.toLocaleString()} {reviewItem.indicatorUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variance:</span>
                        <span className={`font-medium ${
                          Math.abs(reviewItem.varianceFromPrevious || 0) > 20 ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {reviewItem.varianceFromPrevious > 0 ? '+' : ''}{(reviewItem.varianceFromPrevious || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Historical Average:</span>
                        <span className="font-medium">{comparisonData.historicalAvg?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 bg-gray-50 p-8 rounded">
                      No historical data available for comparison
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Comments (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Add comments about this data submission..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
if (feedback.trim()) {
                      handleReject(reviewItem, feedback);
                      setReviewModalOpen(false);
                    } else {
                      const reason = prompt("Please provide a reason for rejection:");
                      if (reason && reason.trim()) {
                        handleReject(reviewItem, reason);
                        setReviewModalOpen(false);
                      }
                    }
                  }}
                  className="text-error hover:bg-error/10"
                >
                  <ApperIcon name="X" size={16} className="mr-2" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const changes = feedback || prompt("What changes are needed?");
                    if (changes) {
                      handleRequestChanges(reviewItem, changes);
                      setReviewModalOpen(false);
                    }
                  }}
                  className="text-warning hover:bg-warning/10"
                >
                  <ApperIcon name="Edit" size={16} className="mr-2" />
                  Request Changes
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(reviewItem, feedback);
                    setReviewModalOpen(false);
                  }}
                  className="bg-success hover:bg-success/90"
                >
                  <ApperIcon name="Check" size={16} className="mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;