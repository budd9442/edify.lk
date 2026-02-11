import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/payload';
import supabase from '../services/supabaseClient';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Link as LinkIcon,
  Linkedin,
  Globe,
  Users,
  FileText,
  Heart,
  MessageCircle,
  Eye,
  Camera,
  Award // Add Award icon for Badges section
} from 'lucide-react';
import AvatarUpload from '../components/AvatarUpload';
import { storageService } from '../services/storageService';
import { profilesService, ProfileUpdateData } from '../services/profilesService';
import { articlesService } from '../services/articlesService';
import { FollowButton } from '../components/follow/FollowButton';
import BadgeList from '../components/badges/BadgeList'; // Import BadgeList
import MediumStyleArticleCard from '../components/MediumStyleArticleCard';
import Avatar from '../components/common/Avatar';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { state, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Determine if this is the current user's profile or another user's profile
  const isCurrentUser = !userId || userId === state.user?.id;
  const targetUserId = userId || state.user?.id;

  useEffect(() => {
    if (isCurrentUser && state.user) {
      setProfileUser({ ...state.user });
      setEditedUser({ ...state.user });
    } else if (targetUserId) {
      fetchUserProfile(targetUserId);
    }
  }, [userId, state.user, isCurrentUser, targetUserId]);

  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, bio, avatar_url, social_links, role, created_at, badges, followers_count, following_count, articles_count') // Updated select to include badges and stats
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch user profile:', error);
        return;
      }

      const userData: User = {
        id: profile.id,
        name: profile.name || 'Anonymous',
        email: (profile.id === state.user?.id && state.user?.email) ? state.user.email : '', // Only expose email for current user
        bio: profile.bio || '',
        avatar: profile.avatar_url ? {
          id: 'avatar',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          filename: 'avatar',
          alt: 'avatar',
          mimeType: 'image/png',
          filesize: 0,
          url: profile.avatar_url,
        } : undefined,
        socialLinks: {
          linkedin: profile.social_links?.linkedin,
          website: profile.social_links?.website,
        },
        badges: profile.badges || [], // Map badges
        role: profile.role as any,
        verified: false,
        stats: {
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
          articlesCount: profile.articles_count || 0
        },
        createdAt: profile.created_at,
        updatedAt: new Date().toISOString(),
      };

      setProfileUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const [articles, setArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  useEffect(() => {
    if (profileUser?.id) {
      const fetchArticles = async () => {
        setLoadingArticles(true);
        try {
          const fetchedArticles = await articlesService.listByAuthor(profileUser.id);

          // Add author info to each article since listByAuthor might not return nested author object
          // but we already have profileUser
          const articlesWithAuthor = fetchedArticles.map(article => ({
            ...article,
            author: {
              id: profileUser.id,
              name: profileUser.name,
              avatar: profileUser.avatar?.url
            }
          }));

          setArticles(articlesWithAuthor);
        } catch (err) {
          console.error('Failed to fetch user articles', err);
        } finally {
          setLoadingArticles(false);
        }
      };
      fetchArticles();
    }
  }, [profileUser?.id]);

  const handleEdit = () => {
    if (!isCurrentUser) return; // Only allow editing own profile
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedUser(state.user ? { ...state.user } : null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedUser || !state.user) return;

    setIsLoading(true);
    try {
      // Prepare update data
      const updateData: ProfileUpdateData = {};

      // Check if name changed
      if (editedUser.name !== state.user.name) {
        updateData.name = editedUser.name;
      }

      // Check if bio changed
      if (editedUser.bio !== state.user.bio) {
        updateData.bio = editedUser.bio;
      }

      // Skip avatar changes - they are auto-saved immediately
      //console.log('Skipping avatar change check - avatars are auto-saved');

      // Check if social links changed
      const socialLinksChanged =
        editedUser.socialLinks?.linkedin !== state.user.socialLinks?.linkedin ||
        editedUser.socialLinks?.website !== state.user.socialLinks?.website;

      if (socialLinksChanged) {
        updateData.social_links = {
          linkedin: editedUser.socialLinks?.linkedin,
          website: editedUser.socialLinks?.website,
        };
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        //console.log('Updating profile with data:', updateData);
        await profilesService.updateProfile(updateData);
        //console.log('Profile updated successfully');

        // Update the AuthContext with only the changed fields (excluding avatar - auto-saved)
        const userUpdates: Partial<User> = {};
        if (updateData.name) userUpdates.name = editedUser.name;
        if (updateData.bio !== undefined) userUpdates.bio = editedUser.bio;
        if (updateData.social_links) {
          userUpdates.socialLinks = editedUser.socialLinks;
        }

        //console.log('Updating AuthContext with:', userUpdates);
        updateUser(userUpdates);
      } else {
        //console.log('No changes detected');
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    //console.log('handleAvatarChange called with URL:', url);
    if (!editedUser) return;

    const newEditedUser = {
      ...editedUser,
      avatar: {
        id: 'avatar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filename: 'avatar',
        alt: 'avatar',
        mimeType: 'image/png',
        filesize: 0,
        url: url,
      }
    };

    //console.log('Setting editedUser with new avatar:', newEditedUser.avatar);
    setEditedUser(newEditedUser);

    // Auto-save the avatar change immediately
    try {
      //console.log('Auto-saving avatar change...');
      await profilesService.updateProfile({ avatar_url: url });

      // Update the AuthContext immediately
      updateUser({ avatar: newEditedUser.avatar });

      //console.log('Avatar saved successfully!');
    } catch (error) {
      console.error('Failed to auto-save avatar:', error);
      alert('Failed to save avatar. Please try again.');
    }
  };

  const handleAvatarRemove = async () => {
    if (!editedUser) return;

    const newEditedUser = {
      ...editedUser,
      avatar: undefined
    };

    setEditedUser(newEditedUser);

    // Auto-save the avatar removal immediately
    try {
      //console.log('Auto-saving avatar removal...');
      await profilesService.updateProfile({ avatar_url: undefined } as any);

      // Update the AuthContext immediately
      updateUser({ avatar: undefined });

      //console.log('Avatar removed successfully!');
    } catch (error) {
      console.error('Failed to auto-save avatar removal:', error);
      alert('Failed to remove avatar. Please try again.');
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    if (!editedUser) return;
    setEditedUser({
      ...editedUser,
      [field]: value
    });
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    if (!editedUser) return;
    setEditedUser({
      ...editedUser,
      socialLinks: {
        ...editedUser.socialLinks,
        [platform]: value
      }
    });
  };

  // Show loading state while fetching profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Loading profile...</h2>
        </div>
      </div>
    );
  }

  // Show error if profile not found
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Profile not found</h2>
          <p className="text-gray-400">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // For current user, use editedUser if editing, otherwise use profileUser
  // For other users, always use profileUser
  const user = isCurrentUser ? (editedUser || profileUser) : profileUser;

  return (
    <div className="min-h-screen bg-dark-950 pb-8 md:py-8">
      {/* Mobile Sticky Header */}
      <div className="max-w-4xl mx-auto px-0 md:px-6 lg:px-8">
        {/* ==================== MOBILE VIEW ==================== */}
        <div className="md:hidden mt-4">
          {/* Hero Section */}
          <div className="px-4 mb-6">
            <div className="flex items-start justify-between mb-4">
              {/* Avatar */}
              <div className="relative">
                {isCurrentUser ? (
                  isEditing ? (
                    <AvatarUpload
                      currentImage={user.avatar?.url}
                      onImageChange={handleAvatarChange}
                      onImageRemove={handleAvatarRemove}
                      size="md"
                    />
                  ) : (
                    <>
                      <AvatarUpload
                        currentImage={user.avatar?.url}
                        onImageChange={handleAvatarChange}
                        onImageRemove={handleAvatarRemove}
                        size="md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark-950"></div>
                    </>
                  )
                ) : (
                  <Avatar
                    src={user.avatar?.url}
                    alt={user.name}
                    className="w-20 h-20 border-2 border-primary-500"
                  />
                )}
              </div>

              {/* Stats Row (Right side) */}
              <div className="flex-1 flex justify-around ml-4 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{user.stats.followersCount}</span>
                  <span className="text-xs text-gray-400">Followers</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{user.stats.followingCount}</span>
                  <span className="text-xs text-gray-400">Following</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{user.stats.articlesCount}</span>
                  <span className="text-xs text-gray-400">Articles</span>
                </div>
              </div>
            </div>

            {/* Name & Bio */}
            <div className="mb-4">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-xl font-bold text-white bg-dark-800 border border-dark-700 rounded-lg p-2 w-full"
                    placeholder="Name"
                  />
                  <textarea
                    value={user.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Bio..."
                    className="w-full h-24 bg-dark-800 border border-dark-700 rounded-lg p-3 text-white text-sm"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white mb-1">{user.name}</h1>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {user.bio || (isCurrentUser ? 'Add a bio to introduce yourself.' : '')}
                  </p>
                </>
              )}
            </div>

            {/* Social Links (Small Icons) */}
            {(user.socialLinks?.linkedin || user.socialLinks?.website || isEditing) && (
              <div className="flex items-center gap-4 mb-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={user.socialLinks?.linkedin || ''}
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="LinkedIn URL"
                        className="flex-1 bg-dark-800 border border-dark-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={user.socialLinks?.website || ''}
                        onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                        placeholder="Website URL"
                        className="flex-1 bg-dark-800 border border-dark-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {user.socialLinks?.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {user.socialLinks?.website && (
                      <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400 transition-colors">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isCurrentUser && (
                <div className="flex-1">
                  <FollowButton
                    authorId={user.id}
                    onChange={(isFollowing) => {
                      setProfileUser(prev => prev ? ({
                        ...prev,
                        stats: {
                          ...prev.stats,
                          followersCount: Math.max(0, prev.stats.followersCount + (isFollowing ? 1 : -1))
                        }
                      }) : null);
                    }}
                  />
                </div>
              )}
              {isCurrentUser && (
                isEditing ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 bg-dark-800 text-white rounded-lg font-medium text-sm border border-dark-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex-1 py-2 bg-dark-800 text-white rounded-lg font-medium text-sm border border-dark-700 hover:bg-dark-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )
              )}
            </div>
          </div>

          {/* Badges (Scrollable) */}
          {user.badges && user.badges.length > 0 && (
            <div className="mb-6 pl-4 border-b border-dark-800 pb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Achievements</h3>
              <BadgeList earnedBadgeIds={user.badges} scrollable={true} />
            </div>
          )}

          {/* Mobile Content Tabs/List */}
          <div className="px-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Published Articles</h3>
            {loadingArticles ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-0">
                {articles.map(article => (
                  <MediumStyleArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No articles published yet.
              </div>
            )}
          </div>
        </div>

        {/* ==================== DESKTOP VIEW (Unchanged) ==================== */}
        <div className="hidden md:block">
          {/* Header Section */}
          <div className="bg-dark-900 rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="relative">
                  {isCurrentUser ? (
                    isEditing ? (
                      <AvatarUpload
                        currentImage={user.avatar?.url}
                        onImageChange={handleAvatarChange}
                        onImageRemove={handleAvatarRemove}
                        size="md"
                      />
                    ) : (
                      <>
                        <AvatarUpload
                          currentImage={user.avatar?.url}
                          onImageChange={handleAvatarChange}
                          onImageRemove={handleAvatarRemove}
                          size="md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-dark-900"></div>
                      </>
                    )
                  ) : (
                    // Public profile view - show avatar or default icon
                    <Avatar
                      src={user.avatar?.url}
                      alt={user.name}
                      className="w-20 h-20 border-2 border-primary-500"
                    />
                  )}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="text-2xl font-bold text-white bg-dark-800 border border-dark-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                        placeholder="Enter your name"
                        maxLength={50}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {user.name.length}/50 characters
                      </p>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  )}
                  {user.email && (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                      {user.verified && (
                        <span className="text-green-400 text-sm">✓ Verified</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-400 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                {!isCurrentUser && (
                  <FollowButton
                    authorId={user.id}
                    onChange={(isFollowing) => {
                      setProfileUser(prev => prev ? ({
                        ...prev,
                        stats: {
                          ...prev.stats,
                          followersCount: Math.max(0, prev.stats.followersCount + (isFollowing ? 1 : -1))
                        }
                      }) : null);
                    }}
                  />
                )}
                {isCurrentUser && (
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                          {!isLoading && (
                            <span className="ml-1 text-xs bg-yellow-500 text-black px-1 rounded">
                              Unsaved
                            </span>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Row 1: Badges & Stats */}
            {/* Badges Section */}
            <div className="lg:col-span-2">
              <div className="bg-dark-900 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-primary-400" />
                  <span>Badges & Achievements</span>
                </h2>
                <BadgeList earnedBadgeIds={user.badges || []} />
              </div>
            </div>

            {/* Stats */}
            <div className="lg:col-span-1">
              <div className="bg-dark-900 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4">Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Followers</span>
                    </div>
                    <span className="text-white font-semibold">{user.stats.followersCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Following</span>
                    </div>
                    <span className="text-white font-semibold">{user.stats.followingCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Articles</span>
                    </div>
                    <span className="text-white font-semibold">{user.stats.articlesCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Bio & Social */}
            {/* Bio Section */}
            <div className="lg:col-span-2">
              <div className="bg-dark-900 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                {isCurrentUser && isEditing && (
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      💡 <strong>Tip:</strong> Click on your avatar to upload a new profile picture. Drag and drop is also supported!
                    </p>
                  </div>
                )}
                {isCurrentUser && isEditing ? (
                  <textarea
                    value={user.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full h-32 bg-dark-800 border border-dark-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <p className="text-gray-300 leading-relaxed">
                    {user.bio || (isCurrentUser ? 'No bio available. Click "Edit Profile" to add one.' : 'No bio available.')}
                  </p>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="lg:col-span-1">
              <div className="bg-dark-900 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    {isCurrentUser && isEditing ? (
                      <input
                        type="url"
                        value={user.socialLinks?.linkedin || ''}
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="flex-1 bg-dark-800 border border-dark-700 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : user.socialLinks?.linkedin ? (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        LinkedIn
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">Not connected</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-green-400" />
                    {isCurrentUser && isEditing ? (
                      <input
                        type="url"
                        value={user.socialLinks?.website || ''}
                        onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="flex-1 bg-dark-800 border border-dark-700 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : user.socialLinks?.website ? (
                      <a
                        href={user.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 hover:underline transition-colors"
                      >
                        Website
                      </a>
                    ) : (
                      <span className="text-gray-500 italic">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Articles Section - Full Width */}
          <div className="mt-6">
            <div className="bg-dark-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Published Articles</span>
              </h2>
              {loadingArticles ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map(article => (
                    <div key={article.id} className="border border-dark-700/50 rounded-lg p-4 hover:bg-dark-800/50 transition-colors h-full">
                      <Link to={`/article/${article.slug}`} className="flex flex-col h-full group">
                        <img
                          src={article.coverImage || DEFAULT_COVER_IMAGE}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded-md mb-4"
                        />
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-dark-700/50">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{article.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{article.views}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No articles published yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
