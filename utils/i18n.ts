

import { Language } from '../types';

export type TranslationKey =
  | 'invoice_editor'
  | 'lease_editor'
  | 'preview'
  | 'download_pdf'
  | 'download_file'
  | 'processing'
  | 'reset'
  | 'ai_import'
  | 'switch_invoice'
  | 'switch_lease'
  | 'switch_chat'
  | 'doc_invoice'
  | 'doc_lease'
  | 'ai_modal_title'
  | 'ai_placeholder'
  | 'ai_error'
  | 'ai_missing_key'
  | 'cancel'
  | 'parse'
  | 'analyzing'
  // Wizard
  | 'step_counter'
  | 'btn_back'
  | 'btn_next'
  // Invoice Form
  | 'step_general'
  | 'step_seller'
  | 'step_buyer'
  | 'step_goods'
  | 'type_person'
  | 'type_company'
  | 'lbl_invoice_no'
  | 'lbl_date'
  | 'lbl_time'
  | 'lbl_vat'
  | 'lbl_name_fio'
  | 'lbl_inn'
  | 'lbl_kpp'
  | 'lbl_address'
  | 'lbl_bank_details'
  | 'lbl_bank_name'
  | 'lbl_bik'
  | 'lbl_corr_account'
  | 'lbl_account_number'
  | 'lbl_signatories'
  | 'lbl_director'
  | 'lbl_accountant'
  | 'lbl_buyer_name'
  | 'lbl_service_list'
  | 'lbl_item_name'
  | 'lbl_qty'
  | 'lbl_price'
  | 'msg_no_items'
  // Lease Form
  | 'step_vehicle'
  | 'step_schedule'
  | 'step_financials'
  | 'step_parties'
  | 'lbl_res_id'
  | 'lbl_template_id'
  | 'lbl_optional'
  | 'lbl_source'
  | 'lbl_created'
  | 'grp_vehicle'
  | 'lbl_model'
  | 'lbl_details'
  | 'lbl_plate'
  | 'grp_pickup'
  | 'grp_return'
  | 'lbl_reg_days'
  | 'lbl_reg_price'
  | 'lbl_seas_days'
  | 'lbl_seas_price'
  | 'grp_extra'
  | 'lbl_deposit'
  | 'lbl_total_paid'
  | 'grp_owner'
  | 'lbl_surname'
  | 'lbl_contact'
  | 'grp_renter'
  | 'lbl_passport'
  | 'lbl_terms'
  | 'lbl_fee'
  // Login
  | 'login_title'
  | 'login_desc'
  | 'lbl_username'
  | 'lbl_password'
  | 'btn_login'
  // Preview
  | 'preview_loading'
  | 'preview_not_found'
  | 'preview_lease_title'
  | 'server_preview'
  | 'generating_blob'
  | 'mobile_editor_tab'
  | 'mobile_preview_tab'
  | 'open_shareable_link'
  // Lease Preview
  | 'lp_lease_agreement'
  | 'lp_reservation_id'
  | 'lp_source'
  | 'lp_created_on'
  | 'lp_pickup'
  | 'lp_default_pickup'
  | 'lp_return'
  | 'lp_default_return'
  | 'lp_rental_cost'
  | 'lp_regular_price'
  | 'lp_season_price'
  | 'lp_days'
  | 'lp_extra_options'
  | 'lp_none'
  | 'lp_deposit'
  | 'lp_return_at_end'
  | 'lp_total_price'
  | 'lp_paid_separately'
  | 'lp_owner'
  | 'lp_lessor'
  | 'lp_date_signature'
  | 'lp_rider'
  | 'lp_tenant'
  | 'lp_passport'
  | 'lp_pickup_fee'
  | 'lp_return_fee'
  // Chat
  | 'chat_search'
  | 'chat_type_message'
  | 'chat_active'
  | 'chat_view_profile'
  | 'chat_search_history';

const dictionary: Record<Language, Record<TranslationKey, string>> = {
  ru: {
    invoice_editor: 'Редактор счета',
    lease_editor: 'Редактор договора',
    preview: 'Предпросмотр',
    download_pdf: 'Скачать PDF',
    download_file: 'Скачать Файл',
    processing: 'Обработка...',
    reset: 'Сброс',
    ai_import: 'AI Импорт',
    switch_invoice: 'Счет (РФ)',
    switch_lease: 'Аренда',
    switch_chat: 'Чат',
    doc_invoice: 'A4 PDF • Стандарт РФ',
    doc_lease: 'A4 PDF • Договор аренды',
    ai_modal_title: 'Импорт данных через AI',
    ai_placeholder: 'Вставьте текст счета или детали аренды...',
    ai_error: 'Не удалось распознать данные.',
    ai_missing_key: 'API ключ не найден.',
    cancel: 'Отмена',
    parse: 'Распознать',
    analyzing: 'Анализ...',
    
    // Wizard
    step_counter: 'Шаг {current} из {total}',
    btn_back: 'Назад',
    btn_next: 'Далее',

    // Invoice Form
    step_general: 'Общая информация',
    step_seller: 'Продавец (Исполнитель)',
    step_buyer: 'Покупатель (Заказчик)',
    step_goods: 'Товары и Услуги',
    type_person: 'Самозанятый / ИП',
    type_company: 'Организация',
    lbl_invoice_no: '№ Счета',
    lbl_date: 'Дата',
    lbl_time: 'Время',
    lbl_vat: 'НДС',
    lbl_name_fio: 'Название / ФИО',
    lbl_inn: 'ИНН',
    lbl_kpp: 'КПП',
    lbl_address: 'Юр. Адрес',
    lbl_bank_details: 'БАНКОВСКИЕ РЕКВИЗИТЫ',
    lbl_bank_name: 'Название Банка',
    lbl_bik: 'БИК',
    lbl_corr_account: 'Корр. счет',
    lbl_account_number: 'Расчетный счет',
    lbl_signatories: 'ПОДПИСАНТЫ',
    lbl_director: 'Руководитель',
    lbl_accountant: 'Бухгалтер',
    lbl_buyer_name: 'Название компании',
    lbl_service_list: 'Список услуг',
    lbl_item_name: 'Наименование',
    lbl_qty: 'Кол-во',
    lbl_price: 'Цена (руб)',
    msg_no_items: 'Нет товаров',

    // Lease Form
    step_vehicle: 'Авто и Инфо',
    step_schedule: 'Расписание',
    step_financials: 'Финансы',
    step_parties: 'Стороны и Условия',
    lbl_res_id: 'ID Брони',
    lbl_template_id: 'ID Шаблона',
    lbl_optional: 'Опционально',
    lbl_source: 'Источник',
    lbl_created: 'Создано',
    grp_vehicle: 'ДЕТАЛИ ТС',
    lbl_model: 'Модель',
    lbl_details: 'Детали (Тип, Цвет)',
    lbl_plate: 'Госномер',
    grp_pickup: 'ВЫДАЧА (СТАРТ)',
    grp_return: 'ВОЗВРАТ (КОНЕЦ)',
    lbl_reg_days: 'Дни (Обыч)',
    lbl_reg_price: 'Цена (Обыч)',
    lbl_seas_days: 'Дни (Сезон)',
    lbl_seas_price: 'Цена (Сезон)',
    grp_extra: 'ДОП. ОПЦИИ',
    lbl_deposit: 'Депозит',
    lbl_total_paid: 'ИТОГО ОПЛАЧЕНО',
    grp_owner: 'ВЛАДЕЛЕЦ (АРЕНДОДАТЕЛЬ)',
    lbl_surname: 'Фамилия / Название',
    lbl_contact: 'Контакты',
    grp_renter: 'РАЙДЕР (АРЕНДАТОР)',
    lbl_passport: 'Паспорт',
    lbl_terms: 'Юридические условия',
    lbl_fee: 'Сбор (Fee)',

    // Login
    login_title: 'Ограниченный доступ',
    login_desc: 'Пожалуйста, войдите для просмотра документа.',
    lbl_username: 'Имя пользователя / Email',
    lbl_password: 'Пароль',
    btn_login: 'Войти',

    // Preview
    preview_loading: 'Загрузка документа...',
    preview_not_found: 'Документ не найден',
    preview_lease_title: 'Договор Аренды',
    server_preview: 'Предпросмотр (Сервер)',
    generating_blob: 'Генерация PDF...',
    mobile_editor_tab: 'Редактор',
    mobile_preview_tab: 'Просмотр',
    open_shareable_link: 'Открыть ссылку',

    // Lease Preview HTML
    lp_lease_agreement: 'Договор аренды',
    lp_reservation_id: 'ID Бронирования',
    lp_source: 'Источник',
    lp_created_on: 'Создано',
    lp_pickup: 'Выдача',
    lp_default_pickup: 'Стандартная выдача',
    lp_return: 'Возврат',
    lp_default_return: 'Стандартный возврат',
    lp_rental_cost: 'Стоимость Аренды',
    lp_regular_price: 'Обычная цена',
    lp_season_price: 'Сезонная цена',
    lp_days: 'дн.',
    lp_extra_options: 'Доп. опции',
    lp_none: 'Нет',
    lp_deposit: 'Депозит',
    lp_return_at_end: 'Возврат в конце аренды',
    lp_total_price: 'Итоговая цена',
    lp_paid_separately: 'Оплачивается отдельно',
    lp_owner: 'Владелец',
    lp_lessor: 'Арендодатель',
    lp_date_signature: 'Дата, подпись',
    lp_rider: 'Райдер',
    lp_tenant: 'Арендатор',
    lp_passport: 'Паспорт',
    lp_pickup_fee: 'Сбор за выдачу',
    lp_return_fee: 'Сбор за возврат',
    
    // Chat
    chat_search: 'Поиск чатов',
    chat_type_message: 'Введите сообщение...',
    chat_active: 'Активен',
    chat_view_profile: 'Профиль',
    chat_search_history: 'Поиск в истории'
  },
  en: {
    invoice_editor: 'Invoice Editor',
    lease_editor: 'Lease Editor',
    preview: 'Preview',
    download_pdf: 'Download PDF',
    download_file: 'Download File',
    processing: 'Processing...',
    reset: 'Reset',
    ai_import: 'AI Import',
    switch_invoice: 'Invoice (RU)',
    switch_lease: 'Lease',
    switch_chat: 'Chat',
    doc_invoice: 'A4 PDF • Russian Standard',
    doc_lease: 'A4 PDF • Rental Agreement',
    ai_modal_title: 'AI Data Import',
    ai_placeholder: 'Paste invoice text or lease details here...',
    ai_error: 'Could not parse data.',
    ai_missing_key: 'API Key is missing.',
    cancel: 'Cancel',
    parse: 'Parse',
    analyzing: 'Analyzing...',

    // Wizard
    step_counter: 'Step {current} of {total}',
    btn_back: 'Back',
    btn_next: 'Next',

    // Invoice Form
    step_general: 'General Info',
    step_seller: 'Seller (Provider)',
    step_buyer: 'Buyer (Customer)',
    step_goods: 'Items & Services',
    type_person: 'Self-Employed / IP',
    type_company: 'Company',
    lbl_invoice_no: 'Invoice #',
    lbl_date: 'Date',
    lbl_time: 'Time',
    lbl_vat: 'VAT',
    lbl_name_fio: 'Name / Full Name',
    lbl_inn: 'INN (Tax ID)',
    lbl_kpp: 'KPP',
    lbl_address: 'Legal Address',
    lbl_bank_details: 'BANK DETAILS',
    lbl_bank_name: 'Bank Name',
    lbl_bik: 'BIC',
    lbl_corr_account: 'Corr. Account',
    lbl_account_number: 'Account Number',
    lbl_signatories: 'SIGNATORIES',
    lbl_director: 'Director',
    lbl_accountant: 'Accountant',
    lbl_buyer_name: 'Company Name',
    lbl_service_list: 'List of Services',
    lbl_item_name: 'Name',
    lbl_qty: 'Qty',
    lbl_price: 'Price (RUB)',
    msg_no_items: 'No items',

    // Lease Form
    step_vehicle: 'Vehicle & Info',
    step_schedule: 'Schedule',
    step_financials: 'Financials',
    step_parties: 'Parties & Terms',
    lbl_res_id: 'Res ID',
    lbl_template_id: 'Template ID',
    lbl_optional: 'Optional',
    lbl_source: 'Source',
    lbl_created: 'Created On',
    grp_vehicle: 'VEHICLE DETAILS',
    lbl_model: 'Model Name',
    lbl_details: 'Details (Type, Color)',
    lbl_plate: 'Plate Number',
    grp_pickup: 'PICK-UP (START)',
    grp_return: 'RETURN (END)',
    lbl_reg_days: 'Regular Days',
    lbl_reg_price: 'Regular Price',
    lbl_seas_days: 'Season Days',
    lbl_seas_price: 'Season Price',
    grp_extra: 'EXTRA OPTIONS',
    lbl_deposit: 'Deposit Amount',
    lbl_total_paid: 'TOTAL PAID',
    grp_owner: 'OWNER (LESSOR)',
    lbl_surname: 'Surname / Name',
    lbl_contact: 'Contact',
    grp_renter: 'RIDER (TENANT)',
    lbl_passport: 'Passport No',
    lbl_terms: 'Legal Terms',
    lbl_fee: 'Extra Fee',

    // Login
    login_title: 'Restricted Access',
    login_desc: 'Please log in to view this document.',
    lbl_username: 'Username / Email',
    lbl_password: 'Password',
    btn_login: 'Log In',

    // Preview
    preview_loading: 'Loading Document...',
    preview_not_found: 'Document not found',
    preview_lease_title: 'Lease Agreement Preview',
    server_preview: 'Server Preview',
    generating_blob: 'Generating PDF...',
    mobile_editor_tab: 'Editor',
    mobile_preview_tab: 'Preview',
    open_shareable_link: 'Open Shareable Link',

    // Lease Preview HTML
    lp_lease_agreement: 'Lease agreement',
    lp_reservation_id: 'Reservation ID',
    lp_source: 'Source',
    lp_created_on: 'Created on',
    lp_pickup: 'Pick-up',
    lp_default_pickup: 'Default pick-up',
    lp_return: 'Return',
    lp_default_return: 'Default return',
    lp_rental_cost: 'Rental Cost',
    lp_regular_price: 'Regular price',
    lp_season_price: 'Season price',
    lp_days: 'days',
    lp_extra_options: 'Extra options',
    lp_none: 'None',
    lp_deposit: 'Deposit',
    lp_return_at_end: 'Return at the end of the rental period',
    lp_total_price: 'Total price',
    lp_paid_separately: 'Paid separately',
    lp_owner: 'Owner',
    lp_lessor: 'Lessor',
    lp_date_signature: 'Date, signature',
    lp_rider: 'Rider',
    lp_tenant: 'Tenant',
    lp_passport: 'Passport',
    lp_pickup_fee: 'Pick-up fee',
    lp_return_fee: 'Return fee',

    // Chat
    chat_search: 'Search chats',
    chat_type_message: 'Type a message...',
    chat_active: 'Active now',
    chat_view_profile: 'View profile',
    chat_search_history: 'Search history'
  },
};

export const t = (key: TranslationKey, lang: Language): string => {
  return dictionary[lang][key] || key;
};