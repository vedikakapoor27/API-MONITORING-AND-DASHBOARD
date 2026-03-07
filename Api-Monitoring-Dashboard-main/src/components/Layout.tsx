// src/components/Layout.tsx
import React, { Component, ReactNode } from "react";
import Navigation from "./Navigation";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later.</h1>;
    }
    return this.props.children;
  }
}

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <div>
        <Navigation />
        <main>{children}</main>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;