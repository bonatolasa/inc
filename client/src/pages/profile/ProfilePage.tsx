import React, { useEffect, useState } from 'react';
import { UserCircle2, Mail, Save } from 'lucide-react';
import { userService } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth';

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const hasChanges = name.trim() !== (user?.name || '') || email.trim() !== (user?.email || '');

  const handleSave = async () => {
    if (!hasChanges) return;
    setLoading(true);
    try {
      const response = await userService.updateMe({ name: name.trim(), email: email.trim() });
      if (response.success) {
        await checkAuth();
        alert('Profile updated successfully.');
      }
    } catch (error: any) {
      alert(`Update failed: ${error?.response?.data?.message || 'Unable to update profile'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <UserCircle2 className="w-7 h-7 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">Update your profile details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="you@example.com"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
