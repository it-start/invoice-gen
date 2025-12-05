
import React from 'react';
import { t } from '../../utils/i18n';
import { Language } from '../../types';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: () => void;
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  error: string | null;
  apiKeyMissing: boolean;
  lang: Language;
}

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  onParse,
  input,
  setInput,
  isLoading,
  error,
  apiKeyMissing,
  lang
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">{t('ai_modal_title', lang)}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        {apiKeyMissing ? (
           <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-4 text-sm">
              <strong>{t('ai_missing_key', lang)}</strong>
           </div>
        ) : (
          <>
            <textarea 
                className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none mb-4 resize-none"
                placeholder={t('ai_placeholder', lang)}
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel', lang)}</button>
                <button 
                    onClick={onParse} 
                    disabled={isLoading || !input.trim()} 
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? t('analyzing', lang) : t('parse', lang)}
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
