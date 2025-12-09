
import React, { useState } from 'react';
import { Loader2, Lock, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { BrandLogo } from '../ui/BrandLogo';
import { Language } from '../../types';
import { t } from '../../utils/i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang?: Language;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, lang = 'en' as Language }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(username, password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
            <div className="flex flex-col gap-2">
                <BrandLogo className="text-white h-5 mb-1" />
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lock size={16} />
                    {t('login_title', lang)}
                </h3>
                <p className="text-slate-400 text-xs">{t('login_desc', lang)}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X size={20} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('lbl_username', lang)}</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('lbl_password', lang)}</label>
            <input 
              type="password" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors flex justify-center items-center gap-2"
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : t('btn_login', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
