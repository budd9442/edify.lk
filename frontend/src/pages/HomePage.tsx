import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, BookOpen, ArrowRight } from "lucide-react";
import SEOHead from "../components/seo/SEOHead";
import ArticleCard from "../components/ArticleCard";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Grid from "../components/layout/Grid";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuth } from "../contexts/AuthContext";
import { articleService, ArticleWithAuthor } from "../services/articleService";

const HomePage: React.FC = () => {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<ArticleWithAuthor[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchArticles = async () => {
      console.log("HomePage: Starting article fetch process...");
      setLoading(true);
      setError(null);
      try {
        console.log("HomePage: Fetching featured articles...");
        const featuredData = await articleService.getFeaturedArticles();
        console.log(
          "HomePage: Successfully fetched featured articles.",
          featuredData
        );
        setFeaturedArticles(featuredData);

        console.log("HomePage: Fetching published articles...");
        const articlesData = await articleService.getPublishedArticles(10);
        console.log(
          "HomePage: Successfully fetched published articles.",
          articlesData
        );
        setArticles(articlesData);
      } catch (error: any) {
        console.error("HomePage: An error occurred during fetch.", error);
        setError(error.message || "An unknown error occurred.");
      } finally {
        console.log(
          "HomePage: Fetch process finished. Setting loading to false."
        );
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const trendingArticles = [...articles]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 3);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <p>Please check the browser console for more details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <SEOHead
        title="Edify - Discover Stories That Inspire"
        description="Join thousands of readers exploring ideas that matter. From technology to culture, find your next great read on Edify community."
        keywords={[
          "blog",
          "articles",
          "technology",
          "writing",
          "community",
          "ideas",
        ]}
      />

      {/* Hero Section */}
      <Section padding="xl" background="gradient" animate>
        <div className="text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10"
          >
            <Badge variant="primary" size="md" className="mb-6" animate>
              <Sparkles className="w-4 h-4 mr-2" />
              Welcome to the Future of Blogging
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Discover Stories That{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
                Inspire
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Join thousands of readers exploring ideas that matter. From
              technology to culture, find your next great read in our premium
              community.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user && (
                <Button variant="gradient" size="lg" className="min-w-[200px]">
                  <ArrowRight className="w-5 h-5 ml-2" />
                  Start Reading
                </Button>
              )}
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Explore Articles
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">
                  10K+
                </div>
                <div className="text-gray-400">Active Readers</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">
                  {articles.length}+
                </div>
                <div className="text-gray-400">Published Articles</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">
                  50+
                </div>
                <div className="text-gray-400">Expert Writers</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Section>

      <Container>
        <div className="flex flex-col lg:flex-row gap-12 py-16">
          {/* Main Content */}
          <main className="flex-1 space-y-16">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <Section animate>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
                    <h2 className="text-3xl font-bold text-white">
                      Featured Articles
                    </h2>
                  </div>
                  <Badge variant="primary" size="sm">
                    Editor's Choice
                  </Badge>
                </div>

                <Grid
                  cols={{ default: 1, md: 2 }}
                  gap="lg"
                  animate
                  stagger={0.2}
                >
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} featured />
                  ))}
                </Grid>
              </Section>
            )}

            {/* Trending Section */}
            {trendingArticles.length > 0 && (
              <Section animate>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-red-500" />
                    <h2 className="text-3xl font-bold text-white">
                      Trending Now
                    </h2>
                  </div>
                  <Badge variant="error" size="sm">
                    🔥 Hot
                  </Badge>
                </div>

                <Grid
                  cols={{ default: 1, md: 2, lg: 3 }}
                  gap="md"
                  animate
                  stagger={0.1}
                >
                  {trendingArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="compact"
                    />
                  ))}
                </Grid>
              </Section>
            )}

            {/* Recent Articles */}
            <Section animate>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                  <h2 className="text-3xl font-bold text-white">
                    Latest Articles
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                {articles
                  .filter((article) => !article.featured)
                  .map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ArticleCard article={article} />
                    </motion.div>
                  ))}
              </div>
            </Section>
          </main>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="sticky top-24">
              <Sidebar />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;
