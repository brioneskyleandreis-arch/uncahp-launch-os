import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f1014] text-white p-10 flex flex-col gap-4">
                    <h1 className="text-2xl font-bold text-red-500">Something went wrong.</h1>
                    <div className="bg-gray-900 p-4 rounded overflow-auto border border-gray-800">
                        <h2 className="text-lg font-bold mb-2">Error:</h2>
                        <pre className="text-sm text-red-300 whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</pre>
                        <h2 className="text-lg font-bold mt-4 mb-2">Stack Trace:</h2>
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                    </div>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded w-fit">Reload Page</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
