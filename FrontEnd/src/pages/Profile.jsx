import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useAddress } from '../hooks/useAddress';
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { PersonalInfoSection } from '../components/profile/PersonalInfoSection';
import { AddressSection } from '../components/profile/AddressSection';
import { AvatarModal } from '../components/profile/AvatarModal';
import { PasswordModal } from '../components/profile/PasswordModal';
import { AlertError, AlertSuccess, FullPageLoader } from '../components/ui/Alert';

export const Profile = () => {
  const profileHook = useProfile();
  const addressHook = useAddress();

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const avatar = profileHook.profile?.avatarUrl
    ? (profileHook.profile.avatarUrl.startsWith('http')
        ? profileHook.profile.avatarUrl
        : profileHook.profile.avatarUrl)
    : '/assets/images/profile/avatar-default.png';

  if (profileHook.loadingProfile) {
    return <FullPageLoader message="Đang tải thông tin..." />;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Hồ sơ của tôi</h1>
          {profileHook.profile?.role === 'ADMIN' && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Quản trị viên
            </span>
          )}
        </div>

        {/* Alerts */}
        {profileHook.error && <AlertError message={profileHook.error} />}
        {profileHook.successMsg && <AlertSuccess message={profileHook.successMsg} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left sidebar */}
          <div className="lg:col-span-4">
            <ProfileSidebar
              avatar={avatar}
              profile={profileHook.profile}
              onChangeAvatar={() => setShowAvatarModal(true)}
              onChangePassword={() => setShowPasswordModal(true)}
            />
          </div>

          {/* Right content */}
          <div className="lg:col-span-8 space-y-6">
            <PersonalInfoSection {...profileHook} />
            <AddressSection {...addressHook} />
          </div>
        </div>

        {/* Modals */}
        <AvatarModal
          isOpen={showAvatarModal}
          currentAvatar={avatar}
          onClose={() => setShowAvatarModal(false)}
          onSave={(url) => {
            profileHook.handleAvatarSave(url);
            setShowAvatarModal(false);
          }}
        />
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      </div>
    </main>
  );
};
