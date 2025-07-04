import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { QuizProvider } from './contexts/QuizContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ArticlePage from './pages/ArticlePage';
import SearchPage from './pages/SearchPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import WriteDashboard from './pages/WriteDashboard';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <QuizProvider>
          <Router>
            <div className="min-h-screen bg-dark-950">
              <Header />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/article/:id" element={<ArticlePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/write" element={<WriteDashboard />} />
              </Routes>
            </div>
          </Router>
        </QuizProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;