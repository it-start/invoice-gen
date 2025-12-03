
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Step {
    title: string;
    content: React.ReactNode;
}

interface WizardContainerProps {
    steps: Step[];
}

export const WizardContainer: React.FC<WizardContainerProps> = ({ steps }) => {
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
        return (
            <div className="space-y-6 pb-20">
                {steps.map((step, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {step.title && <h3 className="font-bold text-sm text-slate-700 mb-3 border-b pb-2">{step.title}</h3>}
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
        <div className="flex flex-col h-full relative">
            {/* Mobile Step Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step {currentStep + 1} of {steps.length}
                </span>
                <div className="flex gap-1">
                    {steps.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1 w-3 rounded-full ${idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}
                        />
                    ))}
                </div>
            </div>
            
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">{steps[currentStep].title}</h2>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-1 pb-24 custom-scrollbar">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                    {steps[currentStep].content}
                 </div>
            </div>

            {/* Navigation Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 flex gap-3 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={isFirst}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isFirst ? 'bg-slate-100 text-slate-400' : 'bg-white border border-slate-300 text-slate-700 active:bg-slate-50'}`}
                >
                    <ChevronLeft size={18} /> Back
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                    disabled={isLast}
                     className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isLast ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg active:scale-95'}`}
                >
                    Next <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
