
import { Language } from '../types';

export type TranslationKey =
  | 'invoice_editor'
  | 'lease_editor'
  | 'preview'
  | 'download_pdf'
  | 'processing'
  | 'reset'
  | 'ai_import'
  | 'switch_invoice'
  | 'switch_lease'
  | 'doc_invoice'
  | 'doc_lease'
  | 'ai_modal_title'
  | 'ai_placeholder'
  | 'ai_error'
  | 'ai_missing_key'
  | 'cancel'
  | 'parse'
  | 'analyzing';

const dictionary: Record<Language, Record<TranslationKey, string>> = {
  ru: {
    invoice_editor: 'Редактор счета',
    lease_editor: 'Редактор договора',
    preview: 'Предпросмотр',
    download_pdf: 'Скачать PDF',
    processing: 'Обработка...',
    reset: 'Сброс',
    ai_import: 'AI Импорт',
    switch_invoice: 'Счет (РФ)',
    switch_lease: 'Аренда (Lease)',
    doc_invoice: 'A4 PDF • Стандарт РФ',
    doc_lease: 'A4 PDF • Договор аренды',
    ai_modal_title: 'Импорт данных через AI',
    ai_placeholder: 'Вставьте текст счета или детали аренды...',
    ai_error: 'Не удалось распознать данные.',
    ai_missing_key: 'API ключ не найден.',
    cancel: 'Отмена',
    parse: 'Распознать',
    analyzing: 'Анализ...',
  },
  en: {
    invoice_editor: 'Invoice Editor',
    lease_editor: 'Lease Editor',
    preview: 'Preview',
    download_pdf: 'Download PDF',
    processing: 'Processing...',
    reset: 'Reset',
    ai_import: 'AI Import',
    switch_invoice: 'Invoice (RU)',
    switch_lease: 'Lease Agreement',
    doc_invoice: 'A4 PDF • Russian Standard',
    doc_lease: 'A4 PDF • Rental Agreement',
    ai_modal_title: 'AI Data Import',
    ai_placeholder: 'Paste invoice text or lease details here...',
    ai_error: 'Could not parse data.',
    ai_missing_key: 'API Key is missing.',
    cancel: 'Cancel',
    parse: 'Parse',
    analyzing: 'Analyzing...',
  },
};

export const t = (key: TranslationKey, lang: Language): string => {
  return dictionary[lang][key] || key;
};
