
import { useState, useEffect } from 'react';
import { parseInvoiceText, parseLeaseText } from '../services/geminiService';
import { t } from '../utils/i18n';
import { Language, InvoiceData, LeaseData } from '../types';

type DocType = 'invoice' | 'lease';

export const useAiAssistant = (lang: Language) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    let hasKey = false;
    try {
        // @ts-ignore
        if (process.env.API_KEY) {
            hasKey = true;
        }
    } catch (e) {}
    
    if (!hasKey) {
        setApiKeyMissing(true);
    }
  }, []);

  const open = () => setIsOpen(true);
  const close = () => {
      setIsOpen(false);
      setError(null);
  };

  const parse = async (docType: DocType): Promise<Partial<InvoiceData> | Partial<LeaseData> | null> => {
    if (!input.trim()) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
        let result;
        if (docType === 'invoice') {
            result = await parseInvoiceText(input);
        } else {
            result = await parseLeaseText(input);
        }
        
        if (result) {
            setIsOpen(false);
            setInput('');
            return result;
        } else {
            throw new Error("No data returned");
        }
    } catch (e) {
        console.error("AI Parse Error", e);
        setError(t('ai_error', lang));
        return null;
    } finally {
        setIsLoading(false);
    }
  };

  return {
    isOpen,
    open,
    close,
    input,
    setInput,
    isLoading,
    error,
    apiKeyMissing,
    parse
  };
};
