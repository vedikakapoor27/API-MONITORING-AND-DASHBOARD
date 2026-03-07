import React, { useEffect, useRef, useCallback, useState } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ServerIcon,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Alert {
  id: string;
  timestamp: string;
  endpoint: string;
  environment: string;
  alert_types: string[];
  metrics: { response_time: number; error: number };
  severity?: "critical" | "warning" | "info";
  status?: "active" | "acknowledged" | "resolved";
}

const severityColors = {
  critical: "bg-red-500 text-white animate-pulse",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-500 text-white",
};

const statusColors = {
  active: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  acknowledged: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const alertVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const RECENT_TIME_THRESHOLD_MINUTES = 15;

const isRecentAlert = (timestamp: string): boolean => {
  try {
    const alertTime = new Date(timestamp).getTime();
    if (isNaN(alertTime)) {
      console.warn(`Invalid timestamp: ${timestamp}`);
      return false;
    }
    const currentTime = new Date().getTime();
    const minutesDifference = (currentTime - alertTime) / (1000 * 60);
    return minutesDifference <= RECENT_TIME_THRESHOLD_MINUTES;
  } catch (error) {
    console.error("Error parsing timestamp:", error);
    return false;
  }
};

const AlertSystem: React.FC = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictedAlerts, setPredictedAlerts] = useState<Alert[]>([]);
  const [currentAlertsError, setCurrentAlertsError] = useState<string | null>(null);
  const [predictedAlertsError, setPredictedAlertsError] = useState<string | null>(null);
  const clientRef = useRef<W3CWebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();

  const setupWebSocket = () => {
    const client = new W3CWebSocket("ws://localhost:8000/ws");
    clientRef.current = client;

    client.onopen = () => {
      console.log("WebSocket Client Connected");
      toast({
        title: "WebSocket Connected",
        description: "Successfully connected to the alert system.",
      });
    };

    client.onmessage = (message) => {
      if (!isMountedRef.current) return;
      console.log("WebSocket Message Received:", message.data);
      try {
        const data = JSON.parse(message.data.toString());
        if (!data) {
          console.warn("Empty WebSocket message received");
          return;
        }
        let newAlerts: Alert[] = [];
        if (Array.isArray(data)) {
          newAlerts = data
            .filter((alert: Alert) => isRecentAlert(alert.timestamp) && alert.id)
            .map((alert: Alert) => ({
              ...alert,
              status: alert.status || "active",
            }));
          setAlerts((prevAlerts) => {
            const updatedAlerts = [...newAlerts, ...prevAlerts];
            const uniqueAlerts = Array.from(
              new Map(updatedAlerts.map((alert) => [alert.id, alert])).values()
            );
            return uniqueAlerts.slice(0, 10);
          });
          setCurrentAlertsError(null);
        } else if (typeof data === "object" && data !== null) {
          if (isRecentAlert(data.timestamp) && data.id) {
            newAlerts = [{ ...data, status: data.status || "active" }];
            setAlerts((prevAlerts) => {
              const updatedAlerts = [...newAlerts, ...prevAlerts];
              const uniqueAlerts = Array.from(
                new Map(updatedAlerts.map((alert) => [alert.id, alert])).values()
              );
              return uniqueAlerts.slice(0, 10);
            });
            setCurrentAlertsError(null);
          }
        } else {
          console.warn("Unexpected WebSocket data format:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setCurrentAlertsError("Unable to process real-time alerts. Please try again later.");
        toast({
          title: "Error processing alert",
          description: "Failed to process the incoming alert data.",
          variant: "destructive",
        });
      }
    };

    client.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setCurrentAlertsError("Unable to connect to the alert system. Retrying...");
      toast({
        title: "WebSocket Connection Failed",
        description: "Unable to connect to the alert system. Retrying...",
        variant: "destructive",
      });
    };

    client.onclose = () => {
      console.log("WebSocket Closed");
      if (!isMountedRef.current) return;

      setTimeout(() => {
        if (isMountedRef.current && (!clientRef.current || clientRef.current.readyState === WebSocket.CLOSED)) {
          console.log("Attempting to reconnect WebSocket...");
          setupWebSocket();
        }
      }, 3000);
    };
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/alerts");
        if (!response.ok) {
          throw new Error(`Failed to fetch initial alerts: ${response.status} ${response.statusText}`);
        }
        const initialAlerts = await response.json();
        const recentAlerts = initialAlerts.filter((alert: Alert) => isRecentAlert(alert.timestamp) && alert.id);
        setAlerts((prevAlerts) => {
          const updatedAlerts = [...recentAlerts, ...prevAlerts];
          const uniqueAlerts = Array.from(
            new Map(updatedAlerts.map((alert) => [alert.id, alert])).values()
          );
          return uniqueAlerts.slice(0, 10);
        });
        setCurrentAlertsError(null);
      } catch (err) {
        console.error("Error fetching initial alerts:", err);
        setCurrentAlertsError(`Unable to load initial alerts: ${err.message}. Please try again later.`);
        toast({
          title: "Error",
          description: `Failed to fetch initial alerts: ${err.message}`,
          variant: "destructive",
        });
      }
    };

    const fetchPredictedAlerts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/predicted_alerts", {
          credentials: "include", // Ensure cookies are sent if needed
        });
        if (!response.ok) {
          const errorText = await response.text(); // Get raw response for debugging
          throw new Error(`Failed to fetch predicted alerts: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const predictedData = await response.json();
        const validPredictedAlerts = predictedData
          .filter((alert: Alert) => alert.id)
          .map((alert: Alert) => ({
            ...alert,
            status: alert.status || "active",
          }));
        setPredictedAlerts(validPredictedAlerts.slice(0, 10));
        setPredictedAlertsError(null);
        console.log("Fetched Predicted Alerts:", validPredictedAlerts);
      } catch (err) {
        console.error("Error fetching predicted alerts:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setPredictedAlertsError(`Unable to load predicted alerts: ${errorMessage}. Please try again later or check backend logs.`);
        toast({
          title: "Error",
          description: `Failed to fetch predicted alerts: ${errorMessage}`,
          variant: "destructive",
        });
      }
    };

    console.log("AlertSystem component mounted");
    isMountedRef.current = true;
    fetchAlerts();
    fetchPredictedAlerts();
    setupWebSocket();

    const interval = setInterval(fetchPredictedAlerts, 60000);
    return () => {
      console.log("AlertSystem component unmounting...");
      isMountedRef.current = false;
      clearInterval(interval);
      if (clientRef.current && clientRef.current.readyState === WebSocket.OPEN) {
        clientRef.current.close();
        console.log("WebSocket closed during cleanup.");
      }
    };
  }, [toast]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string, index: number) => {
    if (!alertId) {
      toast({
        title: "Error",
        description: "Alert ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
        credentials: "include", // Ensure cookies are sent if needed
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to acknowledge alert: ${errorData.detail || response.statusText}`);
      }
      setAlerts((prev) =>
        prev.map((alert, i) =>
          i === index ? { ...alert, status: "acknowledged" } : alert
        )
      );
      toast({
        title: "Alert acknowledged",
        description: "The alert has been marked as acknowledged.",
      });
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      toast({
        title: "Error",
        description: `Failed to acknowledge the alert: ${err.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleResolveAlert = useCallback(async (alertId: string, index: number) => {
    if (!alertId) {
      toast({
        title: "Error",
        description: "Alert ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, {
        method: "POST",
        credentials: "include", // Ensure cookies are sent if needed
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to resolve alert: ${errorData.detail || response.statusText}`);
      }
      setAlerts((prev) =>
        prev.map((alert, i) =>
          i === index ? { ...alert, status: "resolved" } : alert
        )
      );
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
    } catch (err) {
      console.error("Error resolving alert:", err);
      toast({
        title: "Error",
        description: `Failed to resolve the alert: ${err.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleAcknowledgePredictedAlert = useCallback(async (alertId: string, index: number) => {
    if (!alertId) {
      toast({
        title: "Error",
        description: "Predicted alert ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/predicted_alerts/${alertId}/acknowledge`, {
        method: "POST",
        credentials: "include", // Ensure cookies are sent if needed
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to acknowledge predicted alert: ${errorData.detail || response.statusText}`);
      }
      setPredictedAlerts((prev) =>
        prev.map((alert, i) =>
          i === index ? { ...alert, status: "acknowledged" } : alert
        )
      );
      toast({
        title: "Predicted alert acknowledged",
        description: "The predicted alert has been marked as acknowledged.",
      });
    } catch (err) {
      console.error("Error acknowledging predicted alert:", err);
      toast({
        title: "Error",
        description: `Failed to acknowledge the predicted alert: ${err.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleResolvePredictedAlert = useCallback(async (alertId: string, index: number) => {
    if (!alertId) {
      toast({
        title: "Error",
        description: "Predicted alert ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/predicted_alerts/${alertId}/resolve`, {
        method: "POST",
        credentials: "include", // Ensure cookies are sent if needed
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to resolve predicted alert: ${errorData.detail || response.statusText}`);
      }
      setPredictedAlerts((prev) =>
        prev.map((alert, i) =>
          i === index ? { ...alert, status: "resolved" } : alert
        )
      );
      toast({
        title: "Predicted alert resolved",
        description: "The predicted alert has been marked as resolved.",
      });
    } catch (err) {
      console.error("Error resolving predicted alert:", err);
      toast({
        title: "Error",
        description: `Failed to resolve the predicted alert: ${err.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  if (location.pathname !== "/alerts") {
    return null;
  }

  const recentAlerts = alerts.filter((alert) => isRecentAlert(alert.timestamp));
  const activeAlertsCount = recentAlerts.filter((alert) => alert.status === "active").length;

  const severityCounts = recentAlerts.reduce(
    (acc, alert) => {
      const severity = alert.severity || "info";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<string, number>
  );

  const severityChartData = {
    labels: ["Critical", "Warning", "Info"],
    datasets: [
      {
        label: "Severity Distribution",
        data: [severityCounts.critical, severityCounts.warning, severityCounts.info],
        backgroundColor: [
          "rgba(239, 68, 68, 0.6)",
          "rgba(234, 179, 8, 0.6)",
          "rgba(59, 130, 246, 0.6)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const severityChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Distribution of Current Alerts by Severity" },
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => `${tooltipItem.label}: ${tooltipItem.raw} alerts`,
        },
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
              <Zap className="inline-block mr-2 h-6 w-6 text-yellow-500" /> Alert System
            </h2>
            <div className="flex items-center gap-2">
              {activeAlertsCount > 0 && (
                <Badge className="bg-red-500 text-white font-semibold">
                  {activeAlertsCount} Active
                </Badge>
              )}
              {recentAlerts.length > 5 && (
                <Button size="sm" onClick={() => navigate("/all-alerts")}>
                  See All ({recentAlerts.length})
                </Button>
              )}
            </div>
          </div>

          {recentAlerts.length > 0 && (
            <div className="mb-6 rounded-md bg-gray-50 dark:bg-gray-800 p-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Current Alerts by Severity
              </h3>
              <div className="h-64 flex justify-center">
                <Pie data={severityChartData} options={severityChartOptions} />
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Current Alerts (Last {RECENT_TIME_THRESHOLD_MINUTES} Minutes)
          </h3>
          {currentAlertsError ? (
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 italic">
              <AlertTriangle className="inline-block mr-2 h-4 w-4" /> {currentAlertsError}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic">
              <Clock className="inline-block mr-2 h-4 w-4" /> No recent alerts at the moment.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <AnimatePresence>
                {recentAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    variants={alertVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      "p-4 rounded-lg border",
                      alert.severity === "critical" && "bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800",
                      alert.severity === "warning" && "bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800",
                      alert.severity === "info" && "bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800",
                      !alert.severity && "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={severityColors[alert.severity || "info"]}>
                          {alert.severity?.toUpperCase() || "INFO"}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="inline-block mr-1 h-4 w-4" />
                          {(() => {
                            try {
                              const date = new Date(alert.timestamp);
                              return isNaN(date.getTime()) ? "Invalid Time" : date.toLocaleTimeString();
                            } catch {
                              return "Invalid Time";
                            }
                          })()}
                        </span>
                      </div>
                      {alert.status && (
                        <Badge className={statusColors[alert.status]}>
                          {alert.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      <ServerIcon className="inline-block mr-2 h-5 w-5 text-blue-500" /> {alert.endpoint}
                      <span className="text-sm ml-1 text-gray-500 dark:text-gray-400">
                        ({alert.environment})
                      </span>
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="inline-block mr-1 h-4 w-4" /> {alert.alert_types.join(", ")}
                    </p>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      Response Time: <span className="font-medium">{alert.metrics.response_time.toFixed(2)}ms</span>
                    </div>
                    {alert.metrics.error > 0 && (
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        Errors: <span className="font-medium">{alert.metrics.error}</span>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {alert.status === "active" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id, index)}
                        >
                          <Clock className="mr-2 h-4 w-4" /> Acknowledge
                        </Button>
                      )}
                      {alert.status !== "resolved" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id, index)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Predicted Alerts (Upcoming)
          </h3>
          {predictedAlertsError ? (
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 italic">
              <AlertTriangle className="inline-block mr-2 h-4 w-4" /> {predictedAlertsError}
            </div>
          ) : predictedAlerts.length === 0 ? (
            <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic">
              <Clock className="inline-block mr-2 h-4 w-4" /> No predicted alerts available.
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {predictedAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    variants={alertVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      "p-4 rounded-lg border border-dashed",
                      alert.severity === "critical" && "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700",
                      alert.severity === "warning" && "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
                      alert.severity === "info" && "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
                      !alert.severity && "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={severityColors[alert.severity || "info"]}>
                          {alert.severity?.toUpperCase() || "INFO"}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="inline-block mr-1 h-4 w-4" />
                          {(() => {
                            try {
                              const date = new Date(alert.timestamp);
                              return isNaN(date.getTime()) ? "Invalid Time" : date.toLocaleTimeString();
                            } catch {
                              return "Invalid Time";
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          PREDICTED
                        </Badge>
                        {alert.status && (
                          <Badge className={statusColors[alert.status]}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      <ServerIcon className="inline-block mr-2 h-5 w-5 text-blue-500" /> {alert.endpoint}
                      <span className="text-sm ml-1 text-gray-500 dark:text-gray-400">
                        ({alert.environment})
                      </span>
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="inline-block mr-1 h-4 w-4" /> {alert.alert_types.join(", ")}
                    </p>
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      Response Time: <span className="font-medium">{alert.metrics.response_time.toFixed(2)}ms</span>
                    </div>
                    {alert.metrics.error > 0 && (
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        Errors: <span className="font-medium">{alert.metrics.error}</span>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {alert.status === "active" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAcknowledgePredictedAlert(alert.id, index)}
                        >
                          <Clock className="mr-2 h-4 w-4" /> Acknowledge
                        </Button>
                      )}
                      {alert.status !== "resolved" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleResolvePredictedAlert(alert.id, index)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                        </Button>
                      )}
                    </div>
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

export default AlertSystem;