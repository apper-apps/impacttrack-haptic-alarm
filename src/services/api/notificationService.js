const mockNotifications = [
  {
    Id: 1,
    type: 'approval',
    title: 'Project Budget Approval Required',
    message: 'The Education Access Project budget of $125,000 requires your approval.',
    priority: 'high',
    isRead: false,
    createdAt: '2024-01-20T10:30:00Z',
    entityId: 3,
    entityType: 'project',
    actionRequired: true,
    metadata: {
      projectName: 'Education Access Project',
      amount: 125000,
      requestedBy: 'Field Coordinator'
    }
  },
  {
    Id: 2,
    type: 'threshold',
    title: 'Attendance Rate Below Target',
    message: 'School attendance in Region A has dropped to 68%, below the 75% threshold.',
    priority: 'high',
    isRead: false,
    createdAt: '2024-01-20T09:15:00Z',
    entityId: 12,
    entityType: 'indicator',
    actionRequired: true,
    metadata: {
      indicatorName: 'School Attendance Rate',
      currentValue: 68,
      threshold: 75,
      region: 'Region A'
    }
  },
  {
    Id: 3,
    type: 'approval',
    title: 'Data Entry Validation Needed',
    message: 'Monthly data entry for Health Outcomes requires validation and approval.',
    priority: 'medium',
    isRead: false,
    createdAt: '2024-01-19T16:45:00Z',
    entityId: 8,
    entityType: 'datapoint',
    actionRequired: true,
    metadata: {
      dataType: 'Health Outcomes',
      period: 'January 2024',
      submittedBy: 'Regional Officer'
    }
  },
  {
    Id: 4,
    type: 'threshold',
    title: 'Water Quality Alert',
    message: 'Water quality testing shows contamination levels at 15ppm, exceeding safe threshold of 10ppm.',
    priority: 'critical',
    isRead: true,
    createdAt: '2024-01-19T14:20:00Z',
    entityId: 7,
    entityType: 'indicator',
    actionRequired: false,
    metadata: {
      indicatorName: 'Water Contamination Level',
      currentValue: 15,
      threshold: 10,
      unit: 'ppm'
    }
  },
  {
    Id: 5,
    type: 'approval',
    title: 'Report Publication Ready',
    message: 'Q4 Impact Report has been reviewed and is ready for final approval and publication.',
    priority: 'medium',
    isRead: true,
    createdAt: '2024-01-18T11:30:00Z',
    entityId: 15,
    entityType: 'report',
    actionRequired: false,
    metadata: {
      reportTitle: 'Q4 Impact Report',
      reviewedBy: 'Senior Analyst',
      pages: 42
    }
  },
  {
    Id: 6,
    type: 'threshold',
    title: 'Beneficiary Count Milestone',
    message: 'Great news! We\'ve reached 95% of our annual beneficiary target ahead of schedule.',
    priority: 'low',
    isRead: false,
    createdAt: '2024-01-18T08:00:00Z',
    entityId: 3,
    entityType: 'indicator',
    actionRequired: false,
    metadata: {
      indicatorName: 'Total Beneficiaries',
      currentValue: 9500,
      target: 10000,
      progress: 95
    }
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const notificationService = {
  async getAll() {
    await delay(300);
    return [...mockNotifications];
  },

  async getById(id) {
    await delay(250);
    const notification = mockNotifications.find(n => n.Id === parseInt(id));
    if (!notification) {
      throw new Error(`Notification with Id ${id} not found`);
    }
    return { ...notification };
  },

  async getUnread() {
    await delay(300);
    return mockNotifications.filter(n => !n.isRead).map(n => ({ ...n }));
  },

  async markAsRead(id) {
    await delay(250);
    const notification = mockNotifications.find(n => n.Id === parseInt(id));
    if (!notification) {
      throw new Error(`Notification with Id ${id} not found`);
    }
    notification.isRead = true;
    return { ...notification };
  },

  async markAllAsRead() {
    await delay(400);
    mockNotifications.forEach(n => n.isRead = true);
    return mockNotifications.map(n => ({ ...n }));
  },

  async dismiss(id) {
    await delay(300);
    const index = mockNotifications.findIndex(n => n.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Notification with Id ${id} not found`);
    }
    const dismissed = mockNotifications.splice(index, 1)[0];
    return { ...dismissed };
  }
};