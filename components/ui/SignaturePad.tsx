
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface SignaturePadProps {
    label: string;
    value?: string;
    onChange: (dataUrl: string) => void;
    onClear: () => void;
    savedLabel?: string;
    clearLabel?: string;
    saveLabel?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
    label, 
    value, 
    onChange, 
    onClear,
    savedLabel = "Saved",
    clearLabel = "Clear",
    saveLabel = "Save"
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);
    const isMobile = useIsMobile();

    // Initialize Canvas Context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';

        // Load existing signature if present and canvas is empty
        if (value && !hasContent) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = value;
            setHasContent(true);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        setHasContent(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        save();
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        if ('touches' in e) {
            const rect = canvas.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
            offsetY: (e as React.MouseEvent).nativeEvent.offsetY
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
        onClear();
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onChange(canvas.toDataURL());
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
                {value && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                        <Check size={12} /> {savedLabel}
                    </span>
                )}
            </div>
            
            <div className="relative border border-slate-200 rounded-lg bg-slate-50 overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    width={isMobile ? 300 : 400}
                    height={150}
                    className="w-full h-auto cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasContent && !value && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-slate-400 text-sm font-bold uppercase select-none">
                        Sign Here
                     </div>
                )}
            </div>

            <div className="flex justify-between mt-2">
                <button 
                    onClick={clear}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 py-1 px-2 rounded hover:bg-red-50 transition-colors"
                >
                    <Eraser size={14} /> {clearLabel}
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
