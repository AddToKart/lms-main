import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { isAuthenticated } from "./utils/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Components
import Layout from "./components/layout/Layout";
import Dashboard from "./components/pages/Dashboard";
import Clients from "./components/pages/Clients";
import Loans from "./components/pages/Loans";
import Payments from "./components/pages/Payments";
import Reports from "./components/pages/Reports";
import Login from "./components/pages/Login";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const isAuthenticated =
          localStorage.getItem("isAuthenticated") === "true";

        if (!token || !isAuthenticated) {
          setIsAuth(false);
          return;
        }

        // Verify token with backend
        const { isAuthenticated: verifyAuth } = await import("./utils/auth");
        const authResult = await verifyAuth();
        setIsAuth(authResult);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - increased from 1 minute
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Prevent unnecessary refetches
      refetchOnReconnect: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage if available
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedMode) {
      const darkModeEnabled = savedMode === "true";
      setIsDarkMode(darkModeEnabled);
      if (darkModeEnabled) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with Layout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout isDarkMode={isDarkMode} onToggleTheme={toggleTheme}>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/loans" element={<Loans />} />
                      <Route path="/payments" element={<Payments />} />
                      <Route path="/reports" element={<Reports />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
