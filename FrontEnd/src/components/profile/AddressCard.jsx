import React from 'react';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const AddressCard = ({ addr, onEdit, onDelete, onSetDefault, savingId }) => {
  const isDefault = addr.isDefault;
  const isProcessing = savingId === addr.id;

  return (
    <div className={`relative rounded-2xl border-2 p-5 transition-all ${isDefault ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-red-300'}`}>
      {isDefault && (
        <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Mặc định
        </span>
      )}

      <div className="space-y-1 pr-16">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{addr.receiverName}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-700">{addr.receiverPhone}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {addr.detailAddress}
          {addr.ward ? `, ${addr.ward}` : ''}
          {addr.district ? `, ${addr.district}` : ''}
          {addr.province ? `, ${addr.province}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {!isDefault && (
          <button
            onClick={() => onSetDefault(addr.id)}
            disabled={isProcessing}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckIcon />
                Đặt làm mặc định
              </>
            )}
          </button>
        )}
        <span className="text-gray-200">|</span>
        <button
          onClick={() => onEdit(addr)}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <EditIcon />
          Sửa
        </button>
        <span className="text-gray-200">|</span>
        <button
          onClick={() => onDelete(addr.id)}
          className="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <TrashIcon />
          Xóa
        </button>
      </div>
    </div>
  );
};
