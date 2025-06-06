import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheck,
  FiShield,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";

// API URL from environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [error, setError] = useState("");

  // Clear any existing auth data on component mount
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  }, []);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Validate form
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Call the authentication API
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Show success state before redirecting
      setLoginSuccess(true);

      // Store the JWT token and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Add a delay before setting isAuthenticated and redirecting
      setTimeout(() => {
        localStorage.setItem("isAuthenticated", "true");
        navigate("/dashboard");
      }, 1500); // 1.5 second delay for animation
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full flex items-center justify-between gap-16">
          {/* Left Side - 3D Cards & Info */}
          <div className="hidden lg:flex flex-1 flex-col space-y-8">
            {/* Main Brand Card */}
            <div className="relative group">
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 transform group-hover:scale-105 transition-all duration-500">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <FiCreditCard className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Loan Management
                    </h3>
                    <p className="text-purple-200">Professional System</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Advanced loan management platform with comprehensive client
                  tracking, automated workflows, and intelligent analytics.
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative group">
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 transform group-hover:scale-105 transition-all duration-300">
                  <FiShield className="text-emerald-400 text-2xl mb-3" />
                  <h4 className="text-white font-semibold mb-2">
                    Secure Platform
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Enterprise-grade security with encrypted data
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 transform group-hover:scale-105 transition-all duration-300">
                  <FiTrendingUp className="text-orange-400 text-2xl mb-3" />
                  <h4 className="text-white font-semibold mb-2">Analytics</h4>
                  <p className="text-gray-300 text-sm">
                    Real-time insights and reporting
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Mirror Card */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/30 rounded-3xl p-6 transform -rotate-2 hover:rotate-0 transition-all duration-700">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl mb-4 transform rotate-12">
                    <span className="text-2xl font-bold text-white">LMS</span>
                  </div>
                  <p className="text-white/90 font-medium">Next Generation</p>
                  <p className="text-purple-200 text-sm">
                    Financial Technology
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 max-w-md w-full">
            {/* Glassmorphism Login Card */}
            <div className="relative group">
              {/* Main card */}
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
                    <FiShield className="text-white text-3xl" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-purple-200">
                    Sign in to access your dashboard
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                      <FiAlertCircle className="h-5 w-5 text-red-400 mr-3" />
                      <span className="text-red-200 text-sm">
                        {error.includes("Rate limit")
                          ? "Too many login attempts. Please wait a moment before trying again."
                          : error}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-purple-300" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="h-5 w-5 text-purple-300" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-300 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-5 w-5" />
                        ) : (
                          <FiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-purple-200">
                        Remember me
                      </span>
                    </label>
                    <a
                      href="#"
                      className="text-sm text-purple-300 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full"
                  >
                    <div className="relative flex items-center justify-center py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold transform group-hover:scale-105 transition-all duration-300">
                      {isLoading ? (
                        loginSuccess ? (
                          <>
                            <FiCheck className="mr-3 h-5 w-5" />
                            <span>Redirecting to dashboard...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="animate-spin mr-3 h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Signing in...
                          </>
                        )
                      ) : (
                        "Sign In"
                      )}
                    </div>
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-center text-purple-200 text-sm">
                    Powered by{" "}
                    <span className="text-white font-semibold">
                      LMS Technology
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional floating elements */}
      <div className="absolute top-10 right-10 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-10 left-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
    </div>
  );
};

export default Login;
