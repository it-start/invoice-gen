
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
  <div className={`mb-4 ${className}`}>
    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center group">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        // text-base prevents iOS zoom on focus. md:text-sm scales it down on desktop.
        // Reduced padding and rounded-lg for a more professional, compact look.
        className={`w-full px-3 py-2.5 border rounded-lg text-base md:text-sm outline-none transition-all duration-200
          ${readOnly 
            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed shadow-none' 
            : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 hover:border-slate-400 shadow-sm'
          }
        `}
      />
      {children}
    </div>
    {helperText && (
      <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-tight">
        {helperText}
      </p>
    )}
  </div>
);

export default InputGroup;
