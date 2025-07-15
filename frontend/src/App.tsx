import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/layout/ErrorBoundary';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ArticlePage from './pages/ArticlePage';
import SearchPage from './pages/SearchPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import WriteDashboard from './pages/WriteDashboard';
import { reportWebVitals } from './utils/performance';

// Report web vitals in production
if (process.env.NODE_ENV === 'production') {
  reportWebVitals(console.log);
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-dark-950">
                <Header />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/article/:slug" element={<ArticlePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/write" element={<WriteDashboard />} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;