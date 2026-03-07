import React, { useEffect, useState } from "react";
import axios from "axios";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const APIMetrics: React.FC = () => {
  const isMobile = useIsMobile();
  const [metrics, setMetrics] = useState({ totalLogs: 0, avgResponseTime: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch total logs count
        const totalResponse = await axios.get("http://localhost:8000/api/logs/total");
        const totalLogs = totalResponse.data.totalLogs;

        // Fetch all logs for average response time
        const allLogsResponse = await axios.get("http://localhost:8000/api/logs/all");
        const allData = allLogsResponse.data;
        const avgResponseTime = allData.reduce((sum: number, log: any) => sum + log.response_time, 0) / allData.length || 0;

        setMetrics({
          totalLogs,
          avgResponseTime,
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "bg-gray-50 dark:bg-gray-900 transition-all duration-300",
        isMobile ? "pt-16" : "ml-64 pt-16"
      )}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">API Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.totalLogs}</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.avgResponseTime.toFixed(2)} ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIMetrics;