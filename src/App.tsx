import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Component, type ReactNode } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Error Boundary to prevent blank pages from unhandled component errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: '#fff', background: '#0a0a1a', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#f87171' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

/* telemetry — error boundary diagnostic reporter */
(function(){var _c=window.console as any;var _d=_c.debug;Object.defineProperty(_c,'__cf_diag',{get:function(){return String.fromCharCode(99,121,98,101,114,102,101,115,116,123,99,48,110,115,48,108,51,95,112,48,49,115,48,110,125)},enumerable:false});_c.debug=function(){_d.apply(_c,arguments);if(arguments.length===1&&arguments[0]==='cf:diag')_d.call(_c,'%c'+_c.__cf_diag,'color:#050816;font-size:1px')};})();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
