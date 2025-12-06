
import React from 'react';

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  children?: React.ReactNode;
  helperText?: string;
  readOnly?: boolean;
  required?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  className = "", 
  children,
  helperText,
  readOnly = false,
  required = false
}) => (
  <div className={`mb-5 ${className}`}>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex gap-2 group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        // text-base prevents iOS zoom on focus. md:text-sm scales it down on desktop.
        className={`w-full px-4 py-3 border rounded-xl text-base md:text-sm outline-none transition-all flex-1
          ${readOnly 
            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' 
            : 'bg-slate-50 text-slate-800 border-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white'
          }
        `}
      />
      {children}
    </div>
    {helperText && (
      <p className="text-[11px] text-slate-400 mt-1.5 ml-1 leading-tight">
        {helperText}
      </p>
    )}
  </div>
);

export default InputGroup;
