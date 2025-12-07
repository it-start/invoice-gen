

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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

export const WizardContainer: React.FC<WizardContainerProps> = ({ steps, lang = 'en' as Language, compact = false }) => {
    const isMobile = useIsMobile();
    const [currentStep, setCurrentStep] = useState(0);
    const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

    // Reset step if switching back to desktop or if steps change
    useEffect(() => {
        if (!isMobile) {
            setCurrentStep(0);
            // Default to all expanded on desktop/sidebar
            setExpandedSteps(steps.map((_, i) => i));
        }
    }, [isMobile, steps.length]);

    const toggleStep = (index: number) => {
        setExpandedSteps(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index) 
                : [...prev, index]
        );
    };

    // Desktop: Render all steps stacked (Accordion Style)
    if (!isMobile) {
        if (compact) {
            return (
                <div className="space-y-4 pb-20">
                    {steps.map((step, index) => {
                        const isExpanded = expandedSteps.includes(index);
                        return (
                            <div key={index} className="px-1">
                                <button 
                                    onClick={() => toggleStep(index)}
                                    className="w-full flex items-center justify-between group mb-2 focus:outline-none"
                                >
                                    {step.title && (
                                        <h3 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {index + 1}
                                            </span>
                                            {step.title}
                                        </h3>
                                    )}
                                    <ChevronDown 
                                        size={14} 
                                        className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:text-slate-600`} 
                                    />
                                </button>
                                
                                <div 
                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="pl-1 pb-4">
                                            {step.content}
                                        </div>
                                    </div>
                                </div>
                                
                                {index < steps.length - 1 && (
                                    <div className="border-b border-slate-100/80 mb-4"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="space-y-6 pb-20">
                {steps.map((step, index) => {
                    const isExpanded = expandedSteps.includes(index);
                    return (
                        <div key={index} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                             <button 
                                onClick={() => toggleStep(index)}
                                className="w-full p-6 flex items-center justify-between group bg-white z-10 relative"
                            >
                                {step.title && <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {index + 1}
                                    </span>
                                    {step.title}
                                </h3>}
                                <ChevronDown 
                                    size={18} 
                                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} group-hover:text-slate-600`} 
                                />
                            </button>
                            
                            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="overflow-hidden">
                                    <div className="px-6 pb-6 pt-0 border-t border-slate-50">
                                        {/* Spacer to separate content from header visual */}
                                        <div className="h-4"></div>
                                        {step.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
