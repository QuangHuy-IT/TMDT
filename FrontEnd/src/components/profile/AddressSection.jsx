import React from 'react';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export const AddressSection = ({
  addresses,
  loadingAddresses,
  showAddressForm,
  editingAddress,
  saving,
  savingId,
  handleAddAddress,
  handleEditAddress,
  handleCancelAddress,
  handleSaveAddress,
  handleDeleteAddress,
  handleSetDefault,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-xl">
            <MapPinIcon />
          </div>
          <h5 className="text-xl font-bold text-gray-900">Địa chỉ nhận hàng</h5>
        </div>
        {!showAddressForm && (
          <button
            onClick={handleAddAddress}
            className="bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center gap-2"
          >
            <PlusIcon />
            Thêm địa chỉ mới
          </button>
        )}
      </div>

      {showAddressForm && (
        <div className="mb-6">
          <AddressForm
            address={editingAddress}
            onSave={handleSaveAddress}
            onCancel={handleCancelAddress}
            saving={saving}
          />
        </div>
      )}

      {loadingAddresses ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-semibold">Chưa có địa chỉ nhận hàng nào.</p>
          <p className="text-sm mt-1">Nhấn "Thêm địa chỉ mới" để bắt đầu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <AddressCard
              key={addr.id}
              addr={addr}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefault}
              savingId={savingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
