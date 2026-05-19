import { useState, useCallback, useEffect } from 'react';
import AddressService from '../services/addressService';

export const useAddress = () => {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await AddressService.getAddresses();
      setAddresses(res.data);
    } catch { /* silent fail */ }
    finally { setLoadingAddresses(false); }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
    setError('');
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddressForm(true);
    setError('');
  };

  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = useCallback(async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (editingAddress?.id) {
        await AddressService.updateAddress(editingAddress.id, formData);
        setSuccessMsg('Cập nhật địa chỉ thành công!');
      } else {
        await AddressService.createAddress(formData);
        setSuccessMsg('Thêm địa chỉ mới thành công!');
      }
      await fetchAddresses();
      handleCancelAddress();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      setError(msg || (editingAddress?.id ? 'Cập nhật địa chỉ thất bại.' : 'Thêm địa chỉ thất bại.'));
    } finally {
      setSaving(false);
    }
  }, [editingAddress, fetchAddresses]);

  const handleDeleteAddress = useCallback(async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setSavingId(id);
    try {
      await AddressService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      setSuccessMsg('Xóa địa chỉ thành công!');
    } catch {
      setError('Xóa địa chỉ thất bại.');
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleSetDefault = useCallback(async (id) => {
    setSavingId(id);
    try {
      await AddressService.setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      setSuccessMsg('Đã đặt làm địa chỉ mặc định!');
    } catch {
      setError('Đặt mặc định thất bại.');
    } finally {
      setSavingId(null);
    }
  }, []);

  return {
    addresses,
    loadingAddresses,
    showAddressForm,
    editingAddress,
    saving,
    savingId,
    error,
    successMsg,
    setShowAddressForm,
    setSuccessMsg,
    setError,
    handleAddAddress,
    handleEditAddress,
    handleCancelAddress,
    handleSaveAddress,
    handleDeleteAddress,
    handleSetDefault,
  };
};
