
import React from 'react';

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  children?: React.ReactNode;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, placeholder, type = "text", className = "", children }) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    <div className="flex gap-2">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all flex-1"
      />
      {children}
    </div>
  </div>
);

export default InputGroup;
