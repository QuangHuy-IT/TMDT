import { useState, useEffect, useCallback, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import UserService from '../services/userService';

export const useProfile = () => {
  const { dispatch } = useContext(ShopContext);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: '', phone: '', email: '', yearOfBirth: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await UserService.getProfile();
      const data = res.data;
      setProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: data });
      setPersonalForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        email: data.email || '',
        yearOfBirth: data.yearOfBirth || '',
      });
    } catch {
      setError('Không thể tải thông tin hồ sơ.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: value }));
    setSuccessMsg('');
  };

  const handleSavePersonal = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await UserService.updateProfile({
        ...profile,
        fullName: personalForm.fullName,
        phone: personalForm.phone,
        yearOfBirth: personalForm.yearOfBirth,
      });
      setProfile(res.data);
      dispatch({ type: 'UPDATE_USER', payload: res.data });
      setEditingPersonal(false);
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thông tin cá nhân thất bại.');
    } finally {
      setSaving(false);
    }
  }, [profile, personalForm, dispatch]);

  const handleCancelEditPersonal = () => {
    setEditingPersonal(false);
    setPersonalForm(p => ({
      ...p,
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      yearOfBirth: profile?.yearOfBirth || '',
    }));
    setError(null);
  };

  const handleAvatarSave = useCallback(async (avatarUrl) => {
    const res = await UserService.updateAvatar(avatarUrl);
    setProfile(res.data);
    dispatch({ type: 'UPDATE_USER', payload: res.data });
    setSuccessMsg('Cập nhật ảnh đại diện thành công!');
  }, [dispatch]);

  return {
    profile,
    loadingProfile,
    editingPersonal,
    personalForm,
    saving,
    error,
    successMsg,
    setEditingPersonal,
    handlePersonalChange,
    handleSavePersonal,
    handleCancelEditPersonal,
    setSuccessMsg,
    setError,
    handleAvatarSave,
  };
};
