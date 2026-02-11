import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { RegisterData } from "../types/payload";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, state } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);
      navigate("/");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View - Sleek Full Page */}
      <div className="md:hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 pb-24 relative">
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

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
              Create Account
            </h1>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <p className="text-red-400 text-xs font-medium">{state.error}</p>
            </div>
          )}

          {/* Registration Form Mobile */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name_mobile" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name_mobile"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email_mobile" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative">
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
                  minLength={6}
                  className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {/* Bio intentionally omitted on mobile for space */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>Sign Up</span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-2 text-center flex flex-col gap-4">
            <p className="text-dark-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-400">
                Sign In
              </Link>
            </p>

            <p className="text-[10px] text-dark-500 leading-tight px-4 opacity-50">
              By joining, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop View - Split Screen */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side - Hero/Branding */}
        <div className="w-1/2 bg-dark-900 relative overflow-hidden flex flex-col justify-between p-12">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-bl from-blue-900/20 to-dark-900 z-10" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            {/* Abstract decorative elements */}
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-20">
            <img
              src="/logo.png"
              alt="edify.exposition.lk logo"
              className="w-48 h-16 object-contain mb-8"
            />
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Start Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Writing Journey.
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-lg">
              Create your portfolio, build an audience, and establish your voice in the tech community.
            </p>
          </div>

          <div className="relative z-20 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800/50 backdrop-blur-sm p-4 rounded-xl border border-dark-700">
                <div className="text-2xl font-bold text-white mb-1">5K+</div>
                <div className="text-sm text-gray-400">Active Writers</div>
              </div>
              <div className="bg-dark-800/50 backdrop-blur-sm p-4 rounded-xl border border-dark-700">
                <div className="text-2xl font-bold text-white mb-1">1M+</div>
                <div className="text-sm text-gray-400">Monthly Readers</div>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-1/2 bg-dark-950 flex items-center justify-center p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-md w-full my-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create an account</h2>
              <p className="text-gray-400">Enter your details to get started.</p>
            </div>

            {state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-red-400 text-sm">{state.error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    id="name_desktop"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="email"
                    id="email_desktop"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password_desktop"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-10 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                    placeholder="Create a password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="bio_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio_desktop"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all"
                  placeholder="Tell us a bit about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {(formData.bio || '').length}/500
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 bg-primary-600 text-white py-3.5 px-4 rounded-lg font-bold hover:bg-primary-500 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
                >
                  <span>Create Account</span>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-primary-500 hover:text-primary-400 font-bold ml-1">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Terms Desktop */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <a
                  href="#"
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
