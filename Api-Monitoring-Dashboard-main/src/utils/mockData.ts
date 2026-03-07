
// Mock data generators for API monitoring system

import { subDays, subHours, subMinutes, format } from 'date-fns';

// API Environments
export const environments = ['Production', 'Staging', 'Development', 'On-Premises', 'AWS', 'Azure', 'GCP'];

// API Services
export const services = [
  'Authentication', 
  'User Management', 
  'Payment Processing', 
  'Order Management', 
  'Inventory', 
  'Analytics', 
  'Notifications',
  'Search',
  'Recommendations',
  'Media Processing'
];

// API Endpoints
export const endpoints = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/users',
  '/api/v1/payments/process',
  '/api/v1/orders',
  '/api/v1/products',
  '/api/v1/analytics/events',
  '/api/v1/notifications/send',
  '/api/v1/search',
  '/api/v1/recommendations',
  '/api/v1/media/upload'
];

// Error Types
export const errorTypes = [
  '4xx Client Errors',
  '5xx Server Errors',
  'Timeouts',
  'Authentication Failures',
  'Validation Errors',
  'Rate Limiting',
  'Dependencies Unavailable'
];

// Generate random number within range
export const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random boolean with probability
export const randomBoolean = (probability = 0.5): boolean => {
  return Math.random() < probability;
};

// Random item from array
export const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate time series data
export const generateTimeSeriesData = (
  days = 7,
  dataPointsPerDay = 24,
  valueRange = { min: 10, max: 1000 },
  anomalyProbability = 0.05
): { timestamp: string; value: number; isAnomaly: boolean }[] => {
  const data = [];
  const now = new Date();
  
  for (let day = days - 1; day >= 0; day--) {
    for (let hour = 0; hour < dataPointsPerDay; hour++) {
      const timestamp = subHours(subDays(now, day), dataPointsPerDay - hour - 1);
      const isAnomaly = randomBoolean(anomalyProbability);
      
      let value = randomInRange(valueRange.min, valueRange.max);
      
      // Create more dramatic anomalies
      if (isAnomaly) {
        value = randomBoolean(0.5) 
          ? randomInRange(valueRange.max, valueRange.max * 2) 
          : randomInRange(1, valueRange.min / 2);
      }
      
      data.push({
        timestamp: format(timestamp, "yyyy-MM-dd'T'HH:mm:ss"),
        value,
        isAnomaly
      });
    }
  }
  
  return data;
};

// Generate service health data
export const generateServiceHealthData = () => {
  return services.map(service => {
    const healthStatus = Math.random();
    let status: 'healthy' | 'warning' | 'error';
    
    if (healthStatus > 0.8) {
      status = 'healthy';
    } else if (healthStatus > 0.4) {
      status = 'warning';
    } else {
      status = 'error';
    }
    
    return {
      service,
      status,
      responseTime: randomInRange(20, 2000),
      availability: randomInRange(90, 100) / 100,
      errorRate: randomInRange(0, 10) / 100,
      lastIncident: randomBoolean(0.3) ? format(subDays(new Date(), randomInRange(1, 5)), 'MMM dd, yyyy') : null,
      environment: randomItem(environments)
    };
  });
};

// Generate error distribution data
export const generateErrorDistribution = () => {
  const total = randomInRange(50, 500);
  
  return errorTypes.map(type => ({
    type,
    count: randomInRange(5, total / errorTypes.length * 2),
  }));
};

// Generate endpoint metrics
export const generateEndpointMetrics = () => {
  return endpoints.map(endpoint => ({
    endpoint,
    responseTime: randomInRange(20, 2000),
    throughput: randomInRange(10, 1000),
    errorRate: randomInRange(0, 10) / 100,
    p95: randomInRange(50, 3000),
    p99: randomInRange(100, 5000),
    service: randomItem(services),
    environment: randomItem(environments)
  }));
};

// Generate request trace data
export const generateRequestTrace = () => {
  const steps = randomInRange(3, 8);
  const traceData = [];
  let cumulativeTime = 0;
  
  for (let i = 0; i < steps; i++) {
    const stepTime = randomInRange(5, 200);
    cumulativeTime += stepTime;
    
    traceData.push({
      id: `step-${i + 1}`,
      name: i === 0 
        ? 'API Gateway' 
        : i === steps - 1 
          ? 'Database' 
          : `Service ${randomItem(services)}`,
      time: stepTime,
      cumulativeTime,
      status: randomBoolean(0.9) ? 'success' : 'error',
      metadata: {
        host: `srv-${randomInRange(1, 999)}`,
        region: randomItem(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']),
        instanceType: randomItem(['t3.micro', 't3.small', 'c5.large', 'm5.xlarge']),
      }
    });
  }
  
  // Explicitly type the status as 'success' | 'error' to match RequestTraceData
  const status: 'success' | 'error' = randomBoolean(0.9) ? 'success' : 'error';
  
  return {
    traceId: `trace-${randomInRange(10000, 99999)}`,
    timestamp: format(subMinutes(new Date(), randomInRange(1, 60)), "yyyy-MM-dd'T'HH:mm:ss"),
    totalTime: cumulativeTime,
    endpoint: randomItem(endpoints),
    service: randomItem(services),
    environment: randomItem(environments),
    status, // Now correctly typed as 'success' | 'error'
    steps: traceData
  };
};

// Generate recent alerts
export const generateRecentAlerts = (count = 5) => {
  const alerts = [];
  
  for (let i = 0; i < count; i++) {
    const minutesAgo = randomInRange(1, 120);
    
    alerts.push({
      id: `alert-${randomInRange(1000, 9999)}`,
      title: randomItem([
        'High Response Time',
        'Increased Error Rate',
        'Service Degradation',
        'Anomaly Detected',
        'Throughput Spike',
        'Unusual Traffic Pattern'
      ]),
      service: randomItem(services),
      environment: randomItem(environments),
      severity: randomItem(['critical', 'high', 'medium', 'low']),
      timestamp: format(subMinutes(new Date(), minutesAgo), "yyyy-MM-dd'T'HH:mm:ss"),
      description: `Alert triggered ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`,
      status: randomItem(['active', 'acknowledged', 'resolved']),
      acknowledged: randomBoolean(0.6)
    });
  }
  
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate prediction data
export const generatePredictionData = () => {
  const now = new Date();
  const predictions = [];
  
  for (let i = 0; i < 24; i++) {
    const timestamp = format(subHours(now, -i), "yyyy-MM-dd'T'HH:mm:ss");
    const actual = i < 0 ? randomInRange(100, 500) : null;
    
    predictions.push({
      timestamp,
      predicted: randomInRange(200, 400),
      actual,
      lowerBound: randomInRange(150, 250),
      upperBound: randomInRange(350, 450),
      anomalyProbability: randomInRange(0, 100) / 100
    });
  }
  
  return predictions;
};
