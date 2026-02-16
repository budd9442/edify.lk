import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import supabase from "../services/supabaseClient";

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setIsValidSession(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session?.user) setIsValidSession(true);
    });
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsValidSession((prev) => (prev === null && !session?.user ? false : prev));
      });
    }, 2500);
    return () => {
      subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const validatePassword = (p: string): string | null => {
    if (p.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(p)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(p)) return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(p) && !/[!@#$%^&*(),.?":{}|<>]/.test(p)) return "Password must contain a number or special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const err = validatePassword(password);
    if (err) {
      setLocalError(err);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(password);
      await logout();
      navigate("/login", { state: { message: "Password updated successfully. Please sign in with your new password." } });
    } catch (error: any) {
      setLocalError(error?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-6">
        <Lock className="w-12 h-12 text-gray-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Invalid or expired link</h1>
        <p className="text-gray-400 text-sm text-center mb-6 max-w-sm">
          This password reset link may have expired or already been used. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="text-primary-500 hover:text-primary-400 font-medium"
        >
          Request new reset link →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="md:hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 pb-24 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Set new password
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your new password below
            </p>
          </div>

          {localError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs font-medium">{localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-primary-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Confirm password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>Update password</span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-400 text-sm">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
            <p className="text-gray-400">Enter your new password below</p>
          </div>

          {localError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password_desktop"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3.5 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm_desktop" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm_desktop"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 px-4 rounded-lg font-bold hover:bg-primary-500 transition-all disabled:opacity-50"
            >
              <span>Update password</span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
