import React from 'react';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export const PersonalInfoSection = ({
  editingPersonal,
  personalForm,
  saving,
  setEditingPersonal,
  handlePersonalChange,
  handleSavePersonal,
  handleCancelEditPersonal,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-xl">
            <UserIcon />
          </div>
          <h5 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h5>
        </div>
        {!editingPersonal && (
          <button
            onClick={() => { setEditingPersonal(true); }}
            className="text-red-600 text-sm font-bold hover:underline flex items-center gap-1"
          >
            <EditIcon />
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
          {editingPersonal ? (
            <input
              type="text"
              name="fullName"
              value={personalForm.fullName}
              onChange={handlePersonalChange}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          ) : (
            <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">
              {personalForm.fullName || 'Chưa cập nhật'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
          <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">{personalForm.email}</div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
          {editingPersonal ? (
            <input
              type="tel"
              name="phone"
              value={personalForm.phone}
              onChange={handlePersonalChange}
              placeholder="Nhập số điện thoại"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          ) : (
            <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">
              {personalForm.phone || 'Chưa cập nhật'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Năm sinh</label>
          {editingPersonal ? (
            <input
              type="number"
              name="yearOfBirth"
              value={personalForm.yearOfBirth}
              onChange={handlePersonalChange}
              min="1900"
              max={new Date().getFullYear()}
              placeholder="VD: 1995"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          ) : (
            <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">
              {personalForm.yearOfBirth || 'Chưa cập nhật'}
            </div>
          )}
        </div>
      </div>

      {editingPersonal && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSavePersonal}
            disabled={saving}
            className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : 'LƯU THÔNG TIN'}
          </button>
          <button
            onClick={handleCancelEditPersonal}
            className="py-3 px-6 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
};
