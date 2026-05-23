import React, { useEffect, useState, useRef } from 'react';
import {
  UserCircle2,
  Mail,
  Phone,
  Shield,
  Clock,
  Save,
  Upload,
  Lock,
  Edit3,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { userService } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { getRoleDisplayName } from '../../utils/roles';
import { formatDate } from '../../utils/formatters';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || null);
  }, [user]);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    email.trim() !== (user?.email || '') ||
    phone.trim() !== (user?.phone || '');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, display the file as base64 or URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatar(result);
        setMessage({ type: 'success', text: 'Avatar updated (preview only)' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await userService.updateMe({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      if (response.success) {
        await checkAuth();
        setIsEditMode(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    setMessage(null);
    try {
      // This would require a backend endpoint for changing password
      // For now, we'll show a placeholder message
      setMessage({ type: 'success', text: 'Password change feature coming soon' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatRoles = () => {
    if (!user?.roles) return 'N/A';
    return (user.roles as any[])
      .map((role) => getRoleDisplayName(role))
      .join(', ');
  };

  const getAccountStatus = () => {
    return user?.isActive ? (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold">Inactive</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UserCircle2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                My Profile
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your account information and preferences
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Picture & Account Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Profile Picture
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg">
                    <UserCircle2 className="w-16 h-16" />
                  </div>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Avatar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account Status
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                {getAccountStatus()}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
                    Member Since
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Column - User Information & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-primary" />
                User Information
              </h3>
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="Your name"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold">
                    {name || 'N/A'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                {isEditMode ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="you@example.com"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold">
                    {email || 'N/A'}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {isEditMode ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="+1 (555) 000-0000"
                  />
                ) : (
                  <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold">
                    {phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role(s)
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-wrap gap-2">
                    {formatRoles() === 'N/A' ? (
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">
                        No roles assigned
                      </span>
                    ) : (
                      formatRoles()
                        .split(', ')
                        .map((role, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/80 rounded-lg font-bold text-sm border border-primary/20"
                          >
                            {role}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Mode Actions */}
              {isEditMode && (
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setName(user?.name || '');
                      setEmail(user?.email || '');
                      setPhone(user?.phone || '');
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account Actions
            </h3>

            <div className="space-y-3">
              {/* Edit Profile Button */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white font-bold transition-colors flex items-center gap-3"
              >
                <Edit3 className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Edit Profile</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your personal information
                  </p>
                </div>
              </button>

              {/* Change Password Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white font-bold transition-colors flex items-center gap-3"
              >
                <Lock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update your password for security
                  </p>
                </div>
              </button>

              {/* Upload Avatar Button */}
              <button
                onClick={handleAvatarClick}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white font-bold transition-colors flex items-center gap-3"
              >
                <Upload className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Upload Avatar</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Change your profile picture
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-orange-500" />
              Change Password
            </h2>

            <div className="space-y-4 mb-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={passwordLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
