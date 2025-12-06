
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/i18n';

interface Step {
    title: string;
    content: React.ReactNode;
}

interface WizardContainerProps {
    steps: Step[];
    lang?: Language;
    compact?: boolean;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({ steps, lang = 'en', compact = false }) => {
    const isMobile = useIsMobile();
    const [currentStep, setCurrentStep] = useState(0);

    // Reset step if switching back to desktop or if steps change
    useEffect(() => {
        if (!isMobile) {
            setCurrentStep(0);
        }
    }, [isMobile]);

    // Desktop: Render all steps stacked
    if (!isMobile) {
        if (compact) {
            return (
                <div className="space-y-8 pb-20">
                    {steps.map((step, index) => (
                        <div key={index} className="px-1">
                            {step.title && (
                                <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    {step.title}
                                </h3>
                            )}
                            <div className="pl-1">
                                {step.content}
                            </div>
                            {index < steps.length - 1 && (
                                <div className="my-8 border-b border-slate-100/80"></div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-8 pb-20">
                {steps.map((step, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        {step.title && <h3 className="font-bold text-sm text-slate-800 mb-6 pb-2 border-b border-slate-50 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">{index + 1}</span>
                            {step.title}
                        </h3>}
                        {step.content}
                    </div>
                ))}
            </div>
        );
    }

    // Mobile: Render Wizard
    const isLast = currentStep === steps.length - 1;
    const isFirst = currentStep === 0;

    return (
        <div className="flex flex-col md:h-full relative">
            {/* Mobile Step Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                    {t('step_counter', lang).replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}
                </span>
                <div className="flex gap-1.5">
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`}
                        />
                    ))}
                </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">{steps[currentStep].title}</h2>

            {/* Content Area - Auto height on mobile, scroll on desktop if needed */}
            <div className="md:flex-1 md:overflow-y-auto p-1 pb-32 custom-scrollbar">
                 <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    {steps[currentStep].content}
                 </div>
            </div>

            {/* Navigation Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex gap-3 z-[60]">
                <button
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={isFirst}
                    className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${isFirst ? 'bg-slate-50 text-slate-300' : 'bg-white border border-slate-200 text-slate-700 active:bg-slate-50 shadow-sm'}`}
                >
                    <ChevronLeft size={18} /> {t('btn_back', lang)}
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    disabled={isLast}
                     className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLast ? 'bg-slate-50 text-slate-300' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95'}`}
                >
                    {t('btn_next', lang)} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
