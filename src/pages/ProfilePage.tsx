import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Twitter,
  Linkedin,
  Globe,
  Users,
  FileText,
  Heart,
  MessageCircle,
  Eye,
  Camera
} from 'lucide-react';
import AvatarUpload from '../components/AvatarUpload';
import { storageService } from '../services/storageService';
import { profilesService, ProfileUpdateData } from '../services/profilesService';
import { FollowButton } from '../components/follow/FollowButton';

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
        .select('id, name, bio, avatar_url, social_links, role, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch user profile:', error);
        return;
      }

      const userData: User = {
        id: profile.id,
        name: profile.name || 'Anonymous',
        email: '', // Don't expose email for other users
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
        socialLinks: profile.social_links,
        role: profile.role as any,
        verified: false,
        stats: { followersCount: 0, followingCount: 0, articlesCount: 0 },
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
      console.log('Skipping avatar change check - avatars are auto-saved');
      
      // Check if social links changed
      const socialLinksChanged = 
        editedUser.socialLinks?.twitter !== state.user.socialLinks?.twitter ||
        editedUser.socialLinks?.linkedin !== state.user.socialLinks?.linkedin ||
        editedUser.socialLinks?.website !== state.user.socialLinks?.website;
        
      if (socialLinksChanged) {
        updateData.social_links = {
          twitter: editedUser.socialLinks?.twitter,
          linkedin: editedUser.socialLinks?.linkedin,
          website: editedUser.socialLinks?.website,
        };
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        console.log('Updating profile with data:', updateData);
        await profilesService.updateProfile(updateData);
        console.log('Profile updated successfully');
        
        // Update the AuthContext with only the changed fields (excluding avatar - auto-saved)
        const userUpdates: Partial<User> = {};
        if (updateData.name) userUpdates.name = editedUser.name;
        if (updateData.bio !== undefined) userUpdates.bio = editedUser.bio;
        if (updateData.social_links) {
          userUpdates.socialLinks = editedUser.socialLinks;
        }
        
        console.log('Updating AuthContext with:', userUpdates);
        updateUser(userUpdates);
      } else {
        console.log('No changes detected');
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
    console.log('handleAvatarChange called with URL:', url);
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
    
    console.log('Setting editedUser with new avatar:', newEditedUser.avatar);
    setEditedUser(newEditedUser);
    
    // Auto-save the avatar change immediately
    try {
      console.log('Auto-saving avatar change...');
      await profilesService.updateProfile({ avatar_url: url });
      
      // Update the AuthContext immediately
      updateUser({ avatar: newEditedUser.avatar });
      
      console.log('Avatar saved successfully!');
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
      console.log('Auto-saving avatar removal...');
      await profilesService.updateProfile({ avatar_url: null });
      
      // Update the AuthContext immediately
      updateUser({ avatar: undefined });
      
      console.log('Avatar removed successfully!');
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
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-dark-900 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative">
                {isEditing ? (
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
                <div className="flex items-center space-x-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                  {user.verified && (
                    <span className="text-green-400 text-sm">✓ Verified</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-gray-400 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {isCurrentUser && (
              <div className="flex space-x-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <div className="bg-dark-900 rounded-lg p-6">
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

            {/* Social Links */}
            <div className="bg-dark-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  {isCurrentUser && isEditing ? (
                    <input
                      type="url"
                      value={user.socialLinks?.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/username"
                      className="flex-1 bg-dark-800 border border-dark-700 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-300">
                      {user.socialLinks?.twitter || 'Not provided'}
                    </span>
                  )}
                </div>
                
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
                  ) : (
                    <span className="text-gray-300">
                      {user.socialLinks?.linkedin || 'Not provided'}
                    </span>
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
                  ) : (
                    <span className="text-gray-300">
                      {user.socialLinks?.website || 'Not provided'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-dark-900 rounded-lg p-6">
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

            {/* Role Badge */}
            <div className="bg-dark-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Role</h2>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin' ? 'bg-red-600 text-white' :
                  user.role === 'editor' ? 'bg-purple-600 text-white' :
                  user.role === 'author' ? 'bg-blue-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
