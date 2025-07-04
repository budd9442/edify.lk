import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Chrome, Linkedin, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (provider: "google" | "linkedin") => {
    setIsLoading(true);
    try {
      await login(provider);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-900 border border-dark-800 rounded-xl p-8 shadow-2xl"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              {/* Logo */}

              <img
                src="/logo.png"
                alt="edify.exposition.lk logo"
                className="w-48 h-16 object-contain"
              />
            </div>
            <p className="text-gray-300">
              Join the community of thinkers and creators
            </p>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleLogin("google")}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white text-dark-950 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
              )}
            </button>

            <button
              onClick={() => handleLogin("linkedin")}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-[#0077B5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#006699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Linkedin className="w-5 h-5" />
              <span>Continue with LinkedIn</span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-dark-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Why join the Edify community?
            </h3>
            <div className="space-y-3">
              {[
                "Discover premium content from expert writers",
                "Connect with like-minded professionals",
                "Share your insights with the community",
                "Access exclusive articles and resources",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
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
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
