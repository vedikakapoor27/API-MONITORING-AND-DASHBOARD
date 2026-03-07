import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { BarChart3, AlertTriangle, Clock, GitGraph, Sparkles, Bell, Grid2X2, Menu, X ,HeartPulse } from 'lucide-react';

const Navigation = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <Grid2X2 className="h-6 w-6" />,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      name: 'Response Time',
      path: '/response-time',
      icon: <Clock className="h-6 w-6" />,
      color: 'from-sky-400 to-blue-500'
    },
    // {
    //   name: 'Errors',
    //   path: '/errors',
    //   icon: <AlertTriangle className="h-6 w-6" />,
    //   color: 'from-rose-400 to-red-500'
    // },
    // {
    //   name: 'Request Flow',
    //   path: '/request-flow',
    //   icon: <GitGraph className="h-6 w-6" />,
    //   color: 'from-emerald-400 to-green-500'
    // },
    {
      name: 'Predictions',
      path: '/predictions',
      icon: <Sparkles className="h-6 w-6" />,
      color: 'from-purple-400 to-violet-500'
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: <Bell className="h-6 w-6" />,
      color: 'from-amber-400 to-yellow-500'
    },
    {
      name: 'API Health',
      path: '/api-health',
      icon: <HeartPulse  className="h-6 w-6" />,
      color: 'from-teal-400 to-cyan-500'
    },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={cn(
        'backdrop-blur-md bg-white/80 dark:bg-gray-900/80 z-10 shadow-sm transition-all duration-300',
        isMobile
          ? 'fixed top-0 left-0 w-full h-20 border-b'
          : 'fixed top-0 left-0 w-64 min-h-[initial] border-r'
      )}
    >
      <div className={cn(
        'flex items-center justify-between',
        isMobile ? 'h-full px-4' : 'h- px-4 border-b'
      )}>
        <div className="flex items-center gap-10">
          {/* Dynamic Graph-Like Logo */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            API Monitor
          </h1>
        </div>
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="h-10 w-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-10 w-8" />}
          </button>
        )}
      </div>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isMobile
            ? 'fixed top-16 left-0 w-full bg-white/90 dark:bg-gray-900/90 border-b shadow-md'
            : 'flex-col p-4 gap-10',
          isMobile && !isMenuOpen && 'h-0 opacity-0 pointer-events-none',
          isMobile && isMenuOpen && 'h-auto opacity-100 max-h-60 overflow-y-auto'
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-10 px-4 py-3 rounded-lg transition-all duration-200',
              isActive
                ? `bg-gradient-to-r ${item.color} text-white shadow-md shadow-${item.color.split('-')[1]}-500/20 hover:shadow-lg`
                : 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
              isMobile ? 'flex-col text-base min-w-[4rem] justify-center' : 'text-base'
            )}
            onClick={isMobile ? toggleMenu : undefined} // Close menu on click for mobile
          >
            {item.icon}
            <span className={cn(!isMobile && 'font-medium')}>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
