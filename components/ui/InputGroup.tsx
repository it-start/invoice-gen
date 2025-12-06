
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
  <div className={`mb-5 ${className}`}>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide">{label}</label>
    <div className="flex gap-2 group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all flex-1"
      />
      {children}
    </div>
  </div>
);

export default InputGroup;
