import React, { useState } from "react";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ChartCard from "@/components/molecules/ChartCard";
import ApperIcon from "@/components/ApperIcon";

const suggestedQueries = [
  "How many women in Cambodia completed financial training in Q2?",
  "Show me female participation rates across all countries",
  "What's the average completion rate for microfinance programs?",
  "Compare youth engagement in Indonesia vs Philippines",
  "Which regions have the highest dropout rates?",
  "Show quarterly growth trends for women's empowerment programs"
];

function Analytics() {
  const [aiQuery, setAiQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setLoading(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response based on query
      const mockResponse = {
        query: aiQuery,
        answer: "Based on the latest data, Cambodia has trained 127,000 people in financial literacy, with 92% female participation. This represents a 12.5% increase from the previous quarter.",
        data: {
          totalTrained: 127000,
          femaleParticipation: 92,
          growth: 12.5,
          topCountries: ["Cambodia", "Philippines", "Indonesia"]
        }
      };
      
      setQueryResult(mockResponse);
      toast.success("AI analysis completed!");
      
    } catch (err) {
      console.error("AI query error:", err);
      toast.error("Failed to process AI query");
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    "Show me female participation rates across all countries",
    "What are the top performing projects this quarter?",
    "Compare loan disbursement trends year over year",
    "Which countries are behind on their targets?",
    "Analyze training session effectiveness by region"
  ];

  // Predictive analytics data
  const predictionData = [{
    name: "Projected Reach",
    data: [450000, 520000, 580000, 650000, 720000, 800000]
  }, {
    name: "Current Trend",
    data: [420000, 450000, 480000, 510000, 540000, 570000]
  }];

  const predictionOptions = {
    chart: {
      type: "line"
    },
    xaxis: {
      categories: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"]
    },
    yaxis: {
      title: {
        text: "People Reached"
      }
    },
    stroke: {
      curve: "smooth",
      width: [3, 2],
      dashArray: [0, 5]
    },
    colors: ["#667eea", "#28a745"]
  };

  // Anomaly detection data
  const anomalyData = [
    {
      country: "Myanmar",
      indicator: "Training Sessions",
      expected: 120,
      actual: 45,
      variance: -62.5,
      status: "high-risk"
    },
    {
      country: "Solomon Islands",
      indicator: "Loan Disbursement",
      expected: 850000,
      actual: 1200000,
      variance: 41.2,
      status: "attention"
    },
    {
      country: "Tonga",
      indicator: "Female Participation",
      expected: 90,
      actual: 96,
      variance: 6.7,
      status: "positive"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">AI-powered analytics and predictive insights</p>
        </div>
        <Button variant="outline">
          <ApperIcon name="Brain" size={16} className="mr-2" />
          AI Settings
        </Button>
      </div>

      {/* AI Query Interface */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ask AI About Your Data</h2>
          <p className="text-gray-600">Ask natural language questions about your program performance</p>
        </div>

        <form onSubmit={handleAIQuery} className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g., 'Show me female participation in Cambodia for Q1 2024'"
                className="text-base"
              />
            </div>
            <Button type="submit" loading={loading} disabled={!aiQuery.trim()}>
              <ApperIcon name="Send" size={16} className="mr-2" />
              Analyze
            </Button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setAiQuery(query)}
                className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-primary hover:text-white rounded-full transition-colors duration-200"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* AI Response */}
        {queryResult && (
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/10">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ApperIcon name="Brain" size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>You asked:</strong> "{queryResult.query}"
                </div>
                <div className="text-gray-900">
                  {queryResult.answer}
                </div>
                
                {queryResult.data && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{queryResult.data.totalTrained.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">People Trained</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{queryResult.data.femaleParticipation}%</div>
                      <div className="text-xs text-gray-600">Female Participation</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <div className="text-2xl font-bold text-success">+{queryResult.data.growth}%</div>
                      <div className="text-xs text-gray-600">Quarter Growth</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Predictive Reach Forecast"
          subtitle="AI-powered projections based on current trends"
          chartData={predictionData}
          chartOptions={predictionOptions}
          type="line"
          height={300}
        />

        {/* Key Insights */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <ApperIcon name="TrendingUp" size={16} className="text-success mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Strong Performance</div>
                <div className="text-gray-600">Cambodia and Philippines exceed targets by 15% this quarter</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <ApperIcon name="AlertTriangle" size={16} className="text-warning mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Attention Needed</div>
                <div className="text-gray-600">Myanmar training sessions declined 40% due to political situation</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-info/10 rounded-lg border border-info/20">
              <ApperIcon name="Target" size={16} className="text-info mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Opportunity</div>
                <div className="text-gray-600">Digital banking adoption shows 25% faster growth in island nations</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <ApperIcon name="Lightbulb" size={16} className="text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Recommendation</div>
                <div className="text-gray-600">Focus Q2 resources on Indonesia and PNG for maximum impact</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Anomaly Detection */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
            <p className="text-sm text-gray-600">Unusual patterns flagged by AI analysis</p>
          </div>
          <Button variant="outline" size="sm">
            <ApperIcon name="Settings" size={16} className="mr-2" />
            Configure Alerts
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Country</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Indicator</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Expected</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Actual</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Variance</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {anomalyData.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{item.country}</td>
                  <td className="py-3 px-4">{item.indicator}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof item.expected === 'number' ? item.expected.toLocaleString() : item.expected}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    {typeof item.actual === 'number' ? item.actual.toLocaleString() : item.actual}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-medium ${
                      item.variance > 0 ? 'text-success' : 'text-error'
                    }`}>
                      {item.variance > 0 ? '+' : ''}{item.variance}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'high-risk' ? 'bg-error/10 text-error' :
                      item.status === 'attention' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      {item.status === 'high-risk' ? 'High Risk' :
                       item.status === 'attention' ? 'Attention' : 'Positive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;