import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LoginCredentials } from "../types/payload";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, state } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View - Sleek Full Page */}
      <div className="md:hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 pb-24 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="edify.exposition.lk logo"
                className="h-12 object-contain brightness-110 drop-shadow-[0_0_15px_rgba(172,131,79,0.3)]"
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h1>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <p className="text-red-400 text-xs font-medium">{state.error}</p>
            </div>
          )}

          {/* Login Form Mobile */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email_mobile" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                id="email_mobile"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password_mobile" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password_mobile"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-xs text-dark-400 hover:text-primary-500 transition-colors">Forgot Password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>Sign In</span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="pt-4 text-center">
            <p className="text-dark-400 text-sm">
              New here?{" "}
              <Link to="/register" className="text-primary-500 font-semibold hover:text-primary-400">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop View - Split Screen */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side - Hero/Branding */}
        <div className="w-1/2 bg-dark-900 relative overflow-hidden flex flex-col justify-between p-12">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-dark-900 z-10" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            {/* Abstract decorative elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-20">
            <img
              src="/logo.png"
              alt="edify.exposition.lk logo"
              className="w-48 h-16 object-contain mb-8"
            />
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Connect, Share, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">
                and Inspire.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-lg">
              Join a community of thought leaders and writers sharing their knowledge with the world.
            </p>
          </div>

          <div className="relative z-20 space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-xl border border-dark-700 lg:mr-12">
              <p className="text-lg text-gray-300 italic mb-4">
                "Edify has completely transformed how I share my technical insights. The community features are unmatched."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <div className="font-semibold text-white">John Doe</div>
                  <div className="text-sm text-gray-400">Senior Developer</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-1/2 bg-dark-950 flex items-center justify-center p-8 lg:p-16">
          <div className="max-w-md w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-400">Please enter your details to sign in.</p>
            </div>

            {state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-red-400 text-sm">{state.error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email_desktop"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password_desktop"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <a href="#" className="text-sm text-primary-500 hover:text-primary-400">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 bg-primary-600 text-white py-3.5 px-4 rounded-lg font-bold hover:bg-primary-500 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
              >
                <span>Sign In</span>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary-500 hover:text-primary-400 font-bold ml-1">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
