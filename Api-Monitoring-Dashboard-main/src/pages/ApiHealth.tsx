import React, { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ServerIcon, Activity, AlertTriangle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiHealth {
  endpoint: string;
  environment: string;
  uptime: number;
  avg_response_time: number;
  error_rate: number;
  status: "healthy" | "degraded" | "critical";
  total_requests: number;
  timestamp?: string;
  id?: string; // Added to handle unique keys for historical records
}

const healthStatusColors = {
  healthy: "bg-green-500 text-white",
  degraded: "bg-yellow-500 text-white",
  critical: "bg-red-500 text-white animate-pulse",
};

const alertVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const ApiHealth: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);
  const [apiHealthError, setApiHealthError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"live" | "history">("live");

  console.log("ApiHealth component rendering, viewMode:", viewMode);

  const fetchApiHealth = async () => {
    setIsLoading(true);
    const endpoint = viewMode === "live" ? "http://localhost:8000/api-health" : "http://localhost:8000/api-health/history?limit=100";
    try {
      console.log(`Fetching API health data from ${endpoint}...`);
      const response = await fetch(endpoint, {
        credentials: "include",
      });
      console.log(`Response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Non-OK response received:", response.status, errorText);
        throw new Error(`Failed to fetch API health: ${response.status} ${errorText}`);
      }
      const healthData = await response.json();
      console.log("Raw API health data fetched:", healthData);
      if (isMounted) {
        setApiHealth(healthData);
        setApiHealthError(null);
        console.log("Processed API health data:", healthData);
      }
    } catch (err: any) {
      console.error("Error fetching API health:", err);
      if (isMounted) {
        const errorMessage = err.message.includes("500") 
          ? "Server error occurred. Please check the backend logs and try again."
          : `Unable to load API health data: ${err.message}. Please try again later.`;
        setApiHealthError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchApiHealth();

    const interval = setInterval(fetchApiHealth, 5000);

    return () => {
      setIsMounted(false);
      clearInterval(interval);
    };
  }, [toast, viewMode]);

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
              <Activity className="inline-block mr-2 h-6 w-6 text-green-500" /> API Health Dashboard
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === "live" ? "history" : "live")}
                className={cn(
                  "px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {viewMode === "live" ? "View History" : "View Live"}
              </button>
              <button
                onClick={fetchApiHealth}
                disabled={isLoading}
                className={cn(
                  "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic">
              <Clock className="inline-block mr-2 h-4 w-4 animate-spin" /> Loading health data...
            </div>
          )}
          {!isLoading && apiHealthError ? (
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 italic">
              <AlertTriangle className="inline-block mr-2 h-4 w-4" /> {apiHealthError}
            </div>
          ) : !isLoading && apiHealth.length === 0 ? (
            <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic">
              <Clock className="inline-block mr-2 h-4 w-4" /> No health data available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {apiHealth.map((health) => (
                  <motion.div
                    key={health.id || `${health.endpoint}_${health.environment}_${health.timestamp || ''}`} // Use id for uniqueness
                    variants={alertVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      "p-4 rounded-lg border",
                      health.status === "critical" && "bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800",
                      health.status === "degraded" && "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800",
                      health.status === "healthy" && "bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        <ServerIcon className="inline-block mr-2 h-5 w-5 text-blue-500" />
                        {health.endpoint}
                      </h4>
                      <Badge className={healthStatusColors[health.status]}>
                        {health.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Environment: <span className="font-medium">{health.environment}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Uptime: <span className="font-medium">{health.uptime}%</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Response Time: <span className="font-medium">{health.avg_response_time}ms</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Error Rate: <span className="font-medium">{health.error_rate}%</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Requests: <span className="font-medium">{health.total_requests}</span>
                    </p>
                    {health.timestamp && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Timestamp: <span className="font-medium">{new Date(health.timestamp).toLocaleString()}</span>
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiHealth;