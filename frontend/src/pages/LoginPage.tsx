import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Container from '../components/layout/Container';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signUp(formData.email, formData.password, formData.fullName);
        setError('Check your email for a confirmation link');
      } else {
        await signIn(formData.email, formData.password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center py-12">
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card padding="xl" className="max-w-md mx-auto">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.png"
                  alt="Edify"
                  className="h-12 mx-auto mb-4"
                />
              </Link>
              <h1 className="text-2xl font-bold text-white mb-2">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-gray-400">
                {isSignUp 
                  ? 'Join the community of writers and readers'
                  : 'Sign in to your account to continue'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  leftIcon={<User className="w-5 h-5" />}
                  required
                  placeholder="Enter your full name"
                />
              )}

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                leftIcon={<Mail className="w-5 h-5" />}
                required
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                leftIcon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
                placeholder="Enter your password"
                helperText={isSignUp ? "Must be at least 6 characters" : undefined}
              />

              {isSignUp && (
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  leftIcon={<Lock className="w-5 h-5" />}
                  showPasswordToggle
                  required
                  placeholder="Confirm your password"
                />
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                loading={loading}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setFormData({
                      email: '',
                      password: '',
                      fullName: '',
                      confirmPassword: ''
                    });
                  }}
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-dark-800">
              <h3 className="text-sm font-medium text-white mb-3">
                Join the Edify community
              </h3>
              <div className="space-y-2">
                {[
                  'Write and publish your articles',
                  'Connect with like-minded readers',
                  'Build your personal brand',
                  'Engage with quality content'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    <span className="text-gray-400 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default LoginPage;