
import { useEffect, useState } from 'react';

// Custom hook for element entry animation
export const useAnimatedEntry = (delay = 0) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
    transitionDelay: `${delay}ms`
  };
};

// Custom hook for staggered animations
export const useStaggeredAnimation = (
  itemCount: number,
  baseDelay = 50,
  stagger = 100
) => {
  return Array.from({ length: itemCount }).map((_, index) => 
    useAnimatedEntry(baseDelay + index * stagger)
  );
};

// Number counter animation
export const useCountAnimation = (
  endValue: number,
  duration = 1000,
  delay = 0,
  startValue = 0
) => {
  const [count, setCount] = useState(startValue);
  
  useEffect(() => {
    if (endValue === startValue) return;
    
    let startTime: number;
    let requestId: number;
    let timer: NodeJS.Timeout;
    
    const countUp = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      setCount(Math.floor(startValue + progressRatio * (endValue - startValue)));
      
      if (progressRatio < 1) {
        requestId = requestAnimationFrame(countUp);
      }
    };
    
    timer = setTimeout(() => {
      requestId = requestAnimationFrame(countUp);
    }, delay);
    
    return () => {
      cancelAnimationFrame(requestId);
      clearTimeout(timer);
    };
  }, [endValue, duration, delay, startValue]);
  
  return count;
};

// Typing animation for text
export const useTypingAnimation = (
  text: string,
  typingSpeed = 50,
  delay = 0
) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    timer = setTimeout(() => {
      let currentIndex = 0;
      
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, typingSpeed);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [text, typingSpeed, delay]);
  
  return displayedText;
};

// Pulse animation
export const usePulse = (
  initialScale = 1,
  pulseScale = 1.05,
  duration = 2000
) => {
  const [scale, setScale] = useState(initialScale);
  
  useEffect(() => {
    let growing = true;
    let requestId: number;
    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % duration;
      const progress = elapsed / duration;
      
      if (progress > 0.5 && growing) {
        growing = false;
      } else if (progress < 0.5 && !growing) {
        growing = true;
      }
      
      const currentScale = growing
        ? initialScale + (pulseScale - initialScale) * (progress * 2)
        : pulseScale - (pulseScale - initialScale) * ((progress - 0.5) * 2);
      
      setScale(currentScale);
      requestId = requestAnimationFrame(animate);
    };
    
    requestId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestId);
  }, [initialScale, pulseScale, duration]);
  
  return {
    transform: `scale(${scale})`,
    transition: 'transform 0.1s ease-out'
  };
};
