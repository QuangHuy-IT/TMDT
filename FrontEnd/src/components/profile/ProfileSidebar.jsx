import React from 'react';

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const ProfileSidebar = ({ avatar, profile, onChangeAvatar, onChangePassword }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center p-8 sticky top-24">
    <div className="relative inline-block mb-6">
      <div className="h-32 w-32 rounded-full border-4 border-red-500 p-1 bg-white mx-auto overflow-hidden">
        <img src={avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
      </div>
      <button
        onClick={onChangeAvatar}
        className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
      >
        <CameraIcon />
      </button>
    </div>

    <h4 className="text-xl font-bold text-gray-900 mb-1">{profile?.fullName || 'Chưa cập nhật'}</h4>
    <p className="text-sm text-gray-500 mb-8">{profile?.email}</p>

    <div className="space-y-3">
      <button
        onClick={onChangeAvatar}
        className="w-full py-3 border-2 border-red-600 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
      >
        Đổi ảnh đại diện
      </button>
      <button
        onClick={onChangePassword}
        className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300"
      >
        Đổi mật khẩu
      </button>
    </div>
  </div>
);
