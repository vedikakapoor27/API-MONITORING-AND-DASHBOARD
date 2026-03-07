
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { useAnimatedEntry } from '@/utils/animations';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    isUpGood?: boolean;
  };
  className?: string;
  delay?: number;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'glass';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  footer,
  trend,
  className,
  delay = 0,
  onClick,
  variant = 'default',
}) => {
  const animationStyle = useAnimatedEntry(delay);
  
  const getCardClass = () => {
    if (variant === 'glass') return 'glass-card';
    if (variant === 'outline') return 'border-2';
    return '';
  };
  
  const getTrendColor = () => {
    if (!trend) return '';
    const isGood = trend.isUpGood ? trend.isPositive : !trend.isPositive;
    return isGood ? 'text-success' : 'text-destructive';
  };
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.isPositive) {
      return (
        <svg 
          className="h-4 w-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg 
        className="h-4 w-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <Card 
      style={animationStyle}
      className={cn(
        'h-full overflow-hidden transition-all duration-300 hover:shadow-md',
        getCardClass(),
        onClick ? 'cursor-pointer' : '',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className={cn('flex items-center text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
      {footer && <CardFooter className="pt-0 text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
};

export default MetricCard;
