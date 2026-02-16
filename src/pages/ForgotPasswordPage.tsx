import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { resetPasswordForEmail, state } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
    } catch (error: any) {
      setLocalError(error?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col justify-center px-6 pb-24 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="w-full max-w-sm mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary-600/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-gray-400 text-sm">
            We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>. Click the link in the email to set a new password.
          </p>
          <p className="text-gray-500 text-xs">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-primary-500 hover:text-primary-400 font-medium"
            >
              try again
            </button>
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 font-medium text-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to sign in
          </Link>
        </div>
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
              Forgot password?
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your email and we&apos;ll send you a link to reset it
            </p>
          </div>

          {(state.error || localError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <p className="text-red-400 text-xs font-medium">{localError || state.error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-primary-500 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-dark-900/50 border border-dark-800 rounded-xl px-4 py-3.5 text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-inner"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span>Send reset link</span>
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
            <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
            <p className="text-gray-400">Enter your email and we&apos;ll send you a reset link</p>
          </div>

          {(state.error || localError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{localError || state.error}</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-dark-900 border border-dark-800 rounded-lg px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 px-4 rounded-lg font-bold hover:bg-primary-500 transition-all disabled:opacity-50"
            >
              <span>Send reset link</span>
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

export default ForgotPasswordPage;
