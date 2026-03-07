import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming this hook is available
import { cn } from "@/lib/utils"; // Assuming this utility is available
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming these are available

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ErrorRateData {
  endpoint: string;
  errorRate: number;
}

const ErrorRateChart: React.FC = () => {
  const isMobile = useIsMobile();
  const [errorData, setErrorData] = useState<ErrorRateData[]>([]);

  useEffect(() => {
    const fetchErrorRates = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/logs");
        const data = response.data;
        const errorRates = data.reduce((acc: { [key: string]: number }, log: any) => {
          acc[log.endpoint] = (acc[log.endpoint] || 0) + (log.status_code >= 400 ? 1 : 0);
          return acc;
        }, {});
        const totalCalls = data.reduce((acc: { [key: string]: number }, log: any) => {
          acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
          return acc;
        }, {});
        const chartData = Object.keys(errorRates).map((endpoint) => ({
          endpoint,
          errorRate: (errorRates[endpoint] / totalCalls[endpoint]) * 100 || 0,
        }));
        setErrorData(chartData);
      } catch (error) {
        console.error("Error fetching error rates:", error);
      }
    };
    fetchErrorRates();
    const interval = setInterval(fetchErrorRates, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: errorData.map((d) => d.endpoint),
    datasets: [
      {
        label: "Error Rate (%)",
        data: errorData.map((d) => d.errorRate),
        backgroundColor: "rgba(27, 46, 222, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height adjustment
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Endpoints",
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        type: "linear",
        beginAtZero: true,
        title: {
          display: true,
          text: "Error Rate (%)",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Error Rates by Endpoint",
      },
    },
  };

  return (
    <div
      className={cn(
        "bg-gray-50 dark:bg-gray-900 transition-all duration-300",
        isMobile ? "pt-16" : "ml-64 pt-0" // Offset for navigation
      )}
    >
      
      <div className="container mx-auto px-4 py-1">
        <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Error Rates by Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 sm:h-80 md:h-96 lg:h-[500px] w-full">
              <Bar data={chartData} options={options} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorRateChart;