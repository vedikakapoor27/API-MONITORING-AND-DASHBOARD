
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import { format, parseISO } from 'date-fns';

interface PredictionDataPoint {
  timestamp: string;
  predicted: number;
  actual: number | null;
  lowerBound: number;
  upperBound: number;
  anomalyProbability: number;
}

interface PredictiveAnalyticsProps {
  title: string;
  data: PredictionDataPoint[];
  metric?: string;
  refreshTrigger?: number;
  className?: string;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  title,
  data,
  metric = 'Response Time',
  refreshTrigger,
  className,
}) => {
  const [displayMode, setDisplayMode] = useState<'all' | 'anomalies'>('all');
  const [anomalyThreshold, setAnomalyThreshold] = useState<string>('0.7');
  const [highlightedPoints, setHighlightedPoints] = useState<PredictionDataPoint[]>([]);
  
  useEffect(() => {
    const threshold = parseFloat(anomalyThreshold);
    const points = data.filter(point => point.anomalyProbability > threshold);
    setHighlightedPoints(points);
  }, [data, anomalyThreshold, refreshTrigger]);
  
  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    return format(date, 'HH:mm');
  };
  
  const handleAnomalyThresholdChange = (value: string) => {
    setAnomalyThreshold(value);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      const anomalyProb = payload[2]?.payload.anomalyProbability;
      
      return (
        <div className="glass p-3 rounded-lg shadow-sm border border-border">
          <p className="text-sm font-medium">{format(date, 'MMM dd, yyyy HH:mm')}</p>
          
          {payload[1]?.value !== null && (
            <p className="text-sm text-foreground mt-1">
              <span className="text-blue-500">Actual:</span> <span className="font-medium">{payload[1].value}</span> ms
            </p>
          )}
          
          <p className="text-sm text-foreground mt-1">
            <span className="text-purple-500">Predicted:</span> <span className="font-medium">{payload[0].value}</span> ms
          </p>
          
          <p className="text-sm text-foreground mt-1">
            <span className="text-gray-500">Range:</span> <span className="font-medium">{payload[3]?.value}</span> - <span className="font-medium">{payload[4]?.value}</span> ms
          </p>
          
          {anomalyProb !== undefined && (
            <p className="text-sm mt-1">
              <span className="text-amber-500">Anomaly Probability:</span>{' '}
              <span className={cn(
                "font-medium",
                anomalyProb > 0.7 ? "text-destructive" : 
                anomalyProb > 0.3 ? "text-warning" : "text-success"
              )}>
                {(anomalyProb * 100).toFixed(0)}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-xs",
                displayMode === 'all' ? "bg-accent" : ""
              )}
              onClick={() => setDisplayMode('all')}
            >
              All Data
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-xs",
                displayMode === 'anomalies' ? "bg-accent" : ""
              )}
              onClick={() => setDisplayMode('anomalies')}
            >
              Anomalies ({highlightedPoints.length})
            </Button>
            <Select value={anomalyThreshold} onValueChange={handleAnomalyThresholdChange}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.3">30%</SelectItem>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.9">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm mt-2">
          <span className="flex items-center">
            <span className="block w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
            Predicted
          </span>
          <span className="flex items-center">
            <span className="block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            Actual
          </span>
          <span className="flex items-center">
            <span className="block w-3 h-3 bg-purple-200 mr-1"></span>
            Confidence Interval
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tickLine={false}
                axisLine={false}
                minTickGap={60}
              />
              <YAxis
                width={45}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Prediction area */}
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="rgba(156, 39, 176, 0.1)"
                name="Lower Bound"
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="rgba(156, 39, 176, 0.1)"
                name="Upper Bound"
                activeDot={false}
              />
              
              {/* Lines */}
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke="#9c27b0"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#9c27b0", stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#2196F3"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#2196F3", stroke: "#fff", strokeWidth: 2 }}
              />
              
              {/* Hidden lines for tooltip */}
              <Line dataKey="anomalyProbability" name="Anomaly Probability" stroke="none" dot={false} />
              <Line dataKey="lowerBound" name="Lower Bound" stroke="none" dot={false} />
              <Line dataKey="upperBound" name="Upper Bound" stroke="none" dot={false} />
              
              {/* Anomaly reference areas */}
              {data.map((point, index) => {
                const threshold = parseFloat(anomalyThreshold);
                if ((displayMode === 'all' || displayMode === 'anomalies') && point.anomalyProbability > threshold) {
                  return (
                    <ReferenceArea
                      key={`anomaly-${index}`}
                      x1={point.timestamp}
                      x2={point.timestamp}
                      y1={0}
                      y2={Math.max(point.predicted * 1.2, point.upperBound * 1.1)}
                      fill="rgba(244, 67, 54, 0.15)"
                      strokeOpacity={0}
                    />
                  );
                }
                return null;
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {displayMode === 'anomalies' && highlightedPoints.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Detected Anomalies</h3>
            <div className="bg-accent/50 rounded-lg p-3 max-h-[100px] overflow-y-auto text-xs">
              {highlightedPoints.map((point, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span>{format(parseISO(point.timestamp), 'MMM dd HH:mm')}</span>
                  <span className="font-medium">
                    {point.predicted.toFixed(0)}ms
                    <span className={point.actual !== null ? (point.actual > point.predicted ? " text-destructive" : " text-success") : ""}>
                      {point.actual !== null ? ` (Actual: ${point.actual})` : ""}
                    </span>
                  </span>
                  <span className="text-destructive">{(point.anomalyProbability * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalytics;
