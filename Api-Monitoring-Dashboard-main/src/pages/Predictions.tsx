import React, { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, AlertTriangle, ServerIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Annotation } from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

interface Prediction {
  risk: string;
  expected_impact: string;
  confidence: number;
  forecasted_response_time: number;
  threshold: number;
}

const Predictions: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://localhost:8000/api/predictions");
        if (!response.ok) throw new Error("Failed to fetch predictions");
        const data = await response.json();
        console.log("Fetched Predictions:", data); // Debug log
        setPredictions(data);
      } catch (err) {
        console.error("Error fetching predictions:", err);
        setError("Unable to load predictions. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to fetch predictions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [toast]);

  if (location.pathname !== "/predictions") {
    return null;
  }

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300",
          isMobile ? "pt-16" : "ml-64 pt-16"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 italic">Loading predictions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300",
          isMobile ? "pt-16" : "ml-64 pt-16"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const predictionEntries = Object.entries(predictions);
  if (predictionEntries.length === 0) {
    return (
      <div
        className={cn(
          "min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300",
          isMobile ? "pt-16" : "ml-64 pt-16"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-500 dark:text-gray-400 italic">
              <Clock className="inline-block mr-2 h-4 w-4" /> No predictions available at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const labels = predictionEntries.map(([key]) => key); // Using endpoint/env as labels
  const forecastedTimes = predictionEntries.map(([, pred]) => pred.forecasted_response_time);
  const thresholds = predictionEntries.map(([, pred]) => pred.threshold);
  const anomalyData = predictionEntries.map(([, pred]) => pred.forecasted_response_time > pred.threshold ? 1 : 0);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Forecasted Response Time (ms)',
        data: forecastedTimes,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointBackgroundColor: predictionEntries.map(([, pred]) =>
          pred.forecasted_response_time > pred.threshold ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
        ),
        pointRadius: 4,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Anomaly (1 if above threshold)',
        data: anomalyData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointRadius: anomalyData.map(val => (val === 1 ? 6 : 0)), // Show points only for anomalies
        pointStyle: 'circle',
        borderWidth: 2,
        fill: false,
        showLine: false,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Forecasted Response Times and Anomalies' },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            if (tooltipItem.dataset.label === 'Forecasted Response Time (ms)') {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw}ms`;
            }
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
      annotation: {
        annotations: {
          thresholdLines: predictionEntries.map(([, pred], index) => ({
            type: 'line',
            yMin: pred.threshold,
            yMax: pred.threshold,
            borderColor: 'rgba(255, 165, 0, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: `Threshold (${pred.threshold.toFixed(2)}ms)`,
              enabled: true,
              position: 'start',
              backgroundColor: 'rgba(255, 165, 0, 0.8)',
              yAdjust: -10,
            },
            yScaleID: 'y',
          })),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Response Time (ms)' },
        suggestedMin: 0,
        suggestedMax: Math.max(...forecastedTimes, ...thresholds) * 1.2,
        position: 'left',
      },
      y1: {
        beginAtZero: true,
        title: { display: true, text: 'Anomaly Count' },
        suggestedMin: 0,
        suggestedMax: 1,
        position: 'right',
        grid: { drawOnChartArea: false }, // Avoid overlapping grid lines
        ticks: { stepSize: 1 },
      },
      x: {
        title: { display: true, text: 'Endpoint/Environment' },
      },
    },
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300",
        isMobile ? "pt-16" : "ml-64 pt-16"
      )}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              <Zap className="inline-block mr-2 h-6 w-6 text-yellow-500" /> Predictions
            </h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500 text-white font-semibold">
                {predictionEntries.length} Predictions
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <motion.table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Endpoint/Env</th>
                  <th className="px-4 py-2">Risk</th>
                  <th className="px-4 py-2">Impact</th>
                  <th className="px-4 py-2">Forecasted Time (ms)</th>
                  <th className="px-4 py-2">Threshold (ms)</th>
                  <th className="px-4 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictionEntries.map(([key, pred]) => (
                  <motion.tr
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b dark:border-gray-600"
                  >
                    <td className="px-4 py-2">
                      <ServerIcon className="inline-block mr-2 h-4 w-4 text-blue-500" />
                      {key}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        className={cn(
                          "text-white",
                          pred.risk === "low" ? "bg-green-500" : pred.risk === "medium" ? "bg-yellow-500" : "bg-red-500"
                        )}
                      >
                        {pred.risk}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{pred.expected_impact}</td>
                    <td className="px-4 py-2 font-medium">{pred.forecasted_response_time.toFixed(2)}</td>
                    <td className="px-4 py-2">{pred.threshold.toFixed(2)}</td>
                    <td className="px-4 py-2">{(pred.confidence * 100).toFixed(2)}%</td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </div>

          {predictionEntries.length > 5 && (
            <Button size="sm" onClick={() => navigate("/all-predictions")} className="mt-4">
              See All ({predictionEntries.length})
            </Button>
          )}

          {/* Chart Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              <AlertTriangle className="inline-block mr-2 h-5 w-5 text-yellow-500" /> Prediction Graph
            </h3>
            <div className="h-100">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;