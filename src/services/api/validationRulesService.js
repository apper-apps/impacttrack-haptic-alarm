import indicatorsData from "@/services/mockData/indicators.json";

// Mock validation rules data
const mockValidationRules = {
  1: { // People Trained
    rangeCheck: { min: 0, max: 10000 },
    varianceThreshold: 50, // 50% variance threshold
    logicalConsistency: [
      {
        type: 'sum_equals',
        relatedIndicatorId: 2,
        operator: 'greater_than',
        description: 'Total participants should include women participants'
      }
    ],
    completenessRules: {
      required: true,
      dependsOn: []
    },
    qualityThresholds: {
      timeliness: 5, // days after period end
      accuracy: 95,  // percentage
      consistency: 90 // percentage
    }
  },
  2: { // Women Participants
    rangeCheck: { min: 0, max: 10000 },
    varianceThreshold: 60,
    logicalConsistency: [
      {
        type: 'less_than_or_equal',
        relatedIndicatorId: 1,
        operator: 'less_than_or_equal',
        description: 'Women participants cannot exceed total participants'
      }
    ],
    completenessRules: {
      required: true,
      dependsOn: [1]
    }
  },
  3: { // Jobs Created
    rangeCheck: { min: 0, max: 5000 },
    varianceThreshold: 75,
    logicalConsistency: [],
    completenessRules: {
      required: false,
      dependsOn: []
    }
  },
  4: { // Loan Value
    rangeCheck: { min: 0, max: 1000000 },
    varianceThreshold: 40,
    logicalConsistency: [],
    completenessRules: {
      required: true,
      dependsOn: []
    },
    qualityThresholds: {
      timeliness: 3,
      accuracy: 98,
      consistency: 95
    }
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const validationRulesService = {
  async getAll() {
    await delay(200);
    return { ...mockValidationRules };
  },

  async getByIndicatorId(indicatorId) {
    await delay(150);
    return mockValidationRules[indicatorId] || null;
  },

  async update(indicatorId, rules) {
    await delay(300);
    mockValidationRules[indicatorId] = {
      ...mockValidationRules[indicatorId],
      ...rules,
      updatedAt: new Date().toISOString()
    };
    return mockValidationRules[indicatorId];
  },

  async create(indicatorId, rules) {
    await delay(300);
    const newRules = {
      ...rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockValidationRules[indicatorId] = newRules;
    return newRules;
  },

  async validateValue(indicatorId, value, context = {}) {
    await delay(100);
    const rules = mockValidationRules[indicatorId];
    if (!rules) return { isValid: true, errors: [] };

    const errors = [];
    const numValue = parseFloat(value);

    // Range validation
    if (rules.rangeCheck) {
      if (rules.rangeCheck.min !== undefined && numValue < rules.rangeCheck.min) {
        errors.push(`Value must be at least ${rules.rangeCheck.min}`);
      }
      if (rules.rangeCheck.max !== undefined && numValue > rules.rangeCheck.max) {
        errors.push(`Value cannot exceed ${rules.rangeCheck.max}`);
      }
    }

    // Variance validation (if previous value provided)
    if (context.previousValue && rules.varianceThreshold) {
      const variance = Math.abs((numValue - context.previousValue) / context.previousValue) * 100;
      if (variance > rules.varianceThreshold) {
        errors.push(`Variance of ${variance.toFixed(1)}% exceeds threshold of ${rules.varianceThreshold}%`);
      }
    }

    // Logical consistency (simplified - would need related values)
    if (rules.logicalConsistency && context.relatedValues) {
      rules.logicalConsistency.forEach(rule => {
        const relatedValue = context.relatedValues[rule.relatedIndicatorId];
        if (relatedValue !== undefined) {
          switch (rule.operator) {
            case 'less_than_or_equal':
              if (numValue > relatedValue) {
                errors.push(rule.description || `Value must be less than or equal to related indicator`);
              }
              break;
            case 'greater_than':
              if (numValue <= relatedValue) {
                errors.push(rule.description || `Value must be greater than related indicator`);
              }
              break;
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      qualityScore: this.calculateQualityScore(rules, numValue, context)
    };
  },

  calculateQualityScore(rules, value, context) {
    let score = 100;

    // Completeness (30%)
    if (!value || value === '') {
      score -= 30;
    }

    // Timeliness (25%)
    if (context.submissionDate && rules.qualityThresholds?.timeliness) {
      const daysLate = context.daysLate || 0;
      if (daysLate > rules.qualityThresholds.timeliness) {
        score -= Math.min(25, daysLate * 2);
      }
    }

    // Consistency (25%)
    if (context.previousValue && rules.varianceThreshold) {
      const variance = Math.abs((value - context.previousValue) / context.previousValue) * 100;
      if (variance > rules.varianceThreshold) {
        score -= Math.min(25, variance / 4);
      }
    }

    // Accuracy (20%) - based on validation errors
    if (context.validationErrors && context.validationErrors.length > 0) {
      score -= Math.min(20, context.validationErrors.length * 5);
    }

    return Math.max(0, Math.round(score));
  },

  async getQualityInsights(indicatorId, submissions) {
    await delay(200);
    
    if (!submissions || submissions.length === 0) {
      return {
        averageQuality: 0,
        trendDirection: 'stable',
        commonIssues: [],
        recommendations: []
      };
    }

    const qualityScores = submissions.map(s => s.qualityScore || 85);
    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;

    // Trend analysis
    const recent = qualityScores.slice(-3);
    const older = qualityScores.slice(-6, -3);
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, score) => sum + score, 0) / older.length : recentAvg;

    let trendDirection = 'stable';
    if (recentAvg > olderAvg + 5) trendDirection = 'improving';
    else if (recentAvg < olderAvg - 5) trendDirection = 'declining';

    // Common issues analysis
    const commonIssues = [];
    const lowQualitySubmissions = submissions.filter(s => (s.qualityScore || 85) < 70);
    
    if (lowQualitySubmissions.length > submissions.length * 0.3) {
      commonIssues.push('High variance from previous periods');
    }
    
    const lateSubmissions = submissions.filter(s => s.daysLate > 2);
    if (lateSubmissions.length > submissions.length * 0.2) {
      commonIssues.push('Late submissions affecting timeliness scores');
    }

    // Recommendations
    const recommendations = [];
    if (averageQuality < 80) {
      recommendations.push('Consider additional validation checks before submission');
    }
    if (trendDirection === 'declining') {
      recommendations.push('Review recent data entry processes for consistency');
    }
    if (commonIssues.includes('Late submissions affecting timeliness scores')) {
      recommendations.push('Implement submission deadline reminders');
    }

    return {
      averageQuality: Math.round(averageQuality),
      trendDirection,
      commonIssues,
      recommendations,
      totalSubmissions: submissions.length,
      highQualityRate: (submissions.filter(s => (s.qualityScore || 85) >= 90).length / submissions.length * 100).toFixed(1)
    };
  }
};

export default validationRulesService;