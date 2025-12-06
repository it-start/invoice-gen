

import React from 'react';
import { LeaseData, Language } from '../types';
import { t } from '../utils/i18n';

interface LeasePreviewProps {
  data: LeaseData;
  lang?: Language;
}

const LeasePreview: React.FC<LeasePreviewProps> = ({ data, lang = 'en' }) => {
  const isNonDefaultTime = (time: string) => time.includes('(Early)') || time.includes('(Late)');

  const getTimeClasses = (time: string) => {
      if (isNonDefaultTime(time)) {
          return "bg-black text-white px-2 py-1 font-bold text-lg";
      }
      return "text-gray-600 text-lg";
  };

  return (
    <div className="bg-white shadow-lg p-8 max-w-[210mm] mx-auto min-h-[297mm] text-sm font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">{t('lp_lease_agreement', lang)}</h1>
          <div className="flex gap-8 text-xs text-gray-500 uppercase tracking-wider">
            <div>
              <div className="mb-1">{t('lp_reservation_id', lang)}</div>
              <div className="text-black font-mono text-sm">{data.reservationId}</div>
            </div>
            <div>
              <div className="mb-1">{t('lp_source', lang)}</div>
              <div className="text-black font-medium">{data.source}</div>
            </div>
            <div>
              <div className="mb-1">{t('lp_created_on', lang)}</div>
              <div className="text-black">{data.createdDate}</div>
            </div>
          </div>
        </div>
        <div className="w-24 h-24 border border-gray-200 flex items-center justify-center text-gray-300 text-xs text-center p-1">
            {data.qrCodeUrl ? (
                <img src={data.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
                <span>[QR Code]</span>
            )}
        </div>
      </div>

      <hr className="border-gray-200 mb-6" />

      {/* Vehicle Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">{data.vehicle.name}</h2>
        <div className="text-xs text-gray-500 uppercase tracking-wide">
            {data.vehicle.details} • {data.vehicle.plate}
        </div>
      </div>

      {/* Dates Block */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="w-1/2 p-4 border-r border-gray-200">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-500 font-bold uppercase">{t('lp_pickup', lang)}</span>
                <span className="text-[10px] text-gray-400">{t('lp_default_pickup', lang)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
                <div className="font-bold text-lg">{data.pickup.date}</div>
                <div className={getTimeClasses(data.pickup.time)}>{data.pickup.time}</div>
            </div>
        </div>
        <div className="w-1/2 p-4 bg-gray-50">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-500 font-bold uppercase">{t('lp_return', lang)}</span>
                <span className="text-[10px] text-gray-400">{t('lp_default_return', lang)}</span>
            </div>
             <div className="flex justify-between items-center mt-2">
                <div className="font-bold text-lg">{data.dropoff.date}</div>
                <div className={getTimeClasses(data.dropoff.time)}>{data.dropoff.time}</div>
            </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div>
            <div className="font-bold text-gray-400 uppercase text-xs mb-2">{t('lp_rental_cost', lang)}</div>
            <div className="flex justify-between border-b border-gray-100 py-1">
                <span>{t('lp_regular_price', lang)} ({data.pricing.daysRegular} {t('lp_days', lang)})</span>
                <span className="font-mono">{data.pricing.priceRegular} THB</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 py-1">
                <span>{t('lp_season_price', lang)} ({data.pricing.daysSeason} {t('lp_days', lang)})</span>
                <span className="font-mono">{data.pricing.priceSeason} THB</span>
            </div>
            {data.pickup.fee > 0 && (
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span>{t('lp_pickup_fee', lang)}</span>
                    <span className="font-mono">{data.pickup.fee} THB</span>
                </div>
            )}
            {data.dropoff.fee > 0 && (
                <div className="flex justify-between border-b border-gray-100 py-1">
                    <span>{t('lp_return_fee', lang)}</span>
                    <span className="font-mono">{data.dropoff.fee} THB</span>
                </div>
            )}
        </div>
        <div>
            <div className="font-bold text-gray-400 uppercase text-xs mb-2">{t('lp_extra_options', lang)}</div>
             {data.extraOptions.length === 0 && <div className="text-gray-400 italic">{t('lp_none', lang)}</div>}
             {data.extraOptions.map((opt, i) => (
                <div key={i} className="flex justify-between border-b border-gray-100 py-1">
                    <span>{opt.name}</span>
                    <span className="font-mono">{opt.price} THB</span>
                </div>
             ))}
        </div>
      </div>

      {/* Totals Block */}
      <div className="flex gap-6 mb-8">
        <div className="flex-1 bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between items-baseline mb-1">
                 <h3 className="font-bold text-lg">{t('lp_deposit', lang)}</h3>
                 <span className="text-2xl font-bold">{data.pricing.deposit} THB</span>
            </div>
            <p className="text-[10px] text-gray-500">{t('lp_return_at_end', lang)}</p>
        </div>
        <div className="flex-1 bg-gray-100 p-4 rounded border border-gray-200">
            <div className="flex justify-between items-baseline mb-1">
                 <h3 className="font-bold text-lg">{t('lp_total_price', lang)}</h3>
                 <span className="text-2xl font-bold">{data.pricing.total} THB</span>
            </div>
            <p className="text-[10px] text-gray-500">{t('lp_paid_separately', lang)}</p>
        </div>
      </div>

      {/* Terms Text */}
      <div className="mb-8 border-t border-b border-gray-200 py-4">
        <pre className="whitespace-pre-wrap font-sans text-[10px] text-gray-600 leading-relaxed h-64 overflow-hidden relative">
           {data.terms}
           <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
        </pre>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-auto pt-4">
        <div>
            <h3 className="font-bold text-lg mb-1">{data.owner.surname}</h3>
            <div className="text-xs text-gray-500 mb-2">{data.owner.contact}</div>
            <div className="text-xs text-gray-500 mb-6">{data.owner.address}</div>
            
            <div className="mb-8">
                <div className="font-bold mb-2">{t('lp_owner', lang)} <span className="font-normal text-gray-400 text-xs ml-2">{t('lp_lessor', lang)}</span></div>
                {data.owner.signature ? (
                   <img src={data.owner.signature} alt="Owner Signature" className="h-12 w-auto object-contain mb-2" />
                ) : (
                    <div className="h-12 w-full"></div>
                )}
                <div className="border-b border-gray-300 mb-1"></div>
                <div className="text-xs text-gray-400">{t('lp_date_signature', lang)}</div>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-lg mb-1">{data.renter.surname}</h3>
            <div className="text-xs text-gray-500 mb-1">{data.renter.contact}</div>
            <div className="text-xs text-gray-500 mb-6">{t('lp_passport', lang)}: {data.renter.passport || '______________'}</div>

            <div className="mb-8">
                <div className="font-bold mb-2">{t('lp_rider', lang)} <span className="font-normal text-gray-400 text-xs ml-2">{t('lp_tenant', lang)}</span></div>
                {data.renter.signature ? (
                   <img src={data.renter.signature} alt="Renter Signature" className="h-12 w-auto object-contain mb-2" />
                ) : (
                    <div className="h-12 w-full"></div>
                )}
                 <div className="border-b border-gray-300 mb-1"></div>
                <div className="text-xs text-gray-400">{t('lp_date_signature', lang)}</div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default LeasePreview;