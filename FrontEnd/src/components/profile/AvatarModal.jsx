import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../ui/Modal';

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const AvatarModal = ({ isOpen, currentAvatar, onClose, onSave }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPreview(currentAvatar);
    setSelectedFile(null);
    setError('');
  }, [currentAvatar, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn một ảnh mới.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/cloudinary/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.imageUrl || data.secureUrl || data.secure_url || data.url;
      if (!url) throw new Error('Missing uploaded image URL');
      await onSave(url);
    } catch {
      setError('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const icon = <CameraIcon />;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi ảnh đại diện" icon={icon} maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-36 h-36 rounded-full border-4 border-red-500 p-1 bg-white overflow-hidden">
            <img src={preview || currentAvatar} alt="Preview" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-red-600 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300 mb-2"
        >
          Chọn ảnh mới
        </button>

        {selectedFile && (
          <p className="text-xs text-gray-500 mb-2 truncate max-w-full px-2">
            {selectedFile.name}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || !selectedFile}
            className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </>
            ) : 'Lưu ảnh'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
