import React from 'react';

export const FormField = ({ label, name, value, onChange, error, required, type = 'text', placeholder, extraProps = {} }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={extraProps.maxLength}
      {...extraProps}
      className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${error ? 'border-red-400' : 'border-gray-200'}`}
    />
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

export const SelectField = ({ label, name, value, onChange, options, error, placeholder, disabled, extraProps = {} }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...extraProps}
      className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-400' : 'border-gray-200'}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.code || opt} value={opt.code || opt}>
          {opt.name || opt}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
  </div>
);

export const CheckboxField = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
    />
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);
