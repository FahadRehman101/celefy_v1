import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isOneSignalError: false 
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a OneSignal-related error
    const isOneSignalError = error.message && (
      error.message.includes('getIdentityModel') ||
      error.message.includes('OneSignal') ||
      error.message.includes('User') ||
      error.message.includes('login')
    );
    
    return { 
      hasError: true, 
      isOneSignalError,
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to console for debugging
    console.group('🚨 Error Boundary Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isOneSignalError: false 
    });
  };

  handleDismiss = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isOneSignalError: false 
    });
  };

  render() {
    if (this.state.hasError) {
      const { isOneSignalError, error } = this.state;
      
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isOneSignalError ? 'Notification System Error' : 'Something went wrong'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isOneSignalError ? 'OneSignal notification system encountered an issue' : 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            {isOneSignalError ? (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Good news:</strong> Your birthday data is safe and the app will continue to work normally. 
                  Only the notification system is affected.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Error details:</strong> {error?.message || 'Unknown error occurred'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={this.handleRetry}
                className="flex-1"
                variant="primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleDismiss}
                className="flex-1"
                variant="secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </div>

            {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Show error details (dev only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
