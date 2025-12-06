import React, { useState, useRef, TouchEvent } from 'react';
import { Archive } from 'lucide-react';

interface SwipeableRowProps {
    children: React.ReactNode;
    onArchive: () => void;
    className?: string;
    isArchived?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onArchive, className = '', isArchived = false }) => {
    const [offset, setOffset] = useState(0);
    const startX = useRef<number>(0);
    const currentOffset = useRef<number>(0);
    const isSwiping = useRef(false);

    // Config
    const ARCHIVE_THRESHOLD = -80; // Distance to trigger
    const MAX_SWIPE = -120;

    const handleTouchStart = (e: TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isSwiping.current) return;
        
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - startX.current;

        // Only allow swiping left
        if (deltaX < 0) {
            // Apply resistance if dragging past max
            const x = deltaX < MAX_SWIPE ? MAX_SWIPE + (deltaX - MAX_SWIPE) * 0.2 : deltaX;
            setOffset(x);
            currentOffset.current = x;
        }
    };

    const handleTouchEnd = () => {
        isSwiping.current = false;
        
        if (currentOffset.current < ARCHIVE_THRESHOLD) {
            // Trigger Action
            setOffset(-1000); // Swipe away completely visual effect
            setTimeout(() => {
                onArchive();
                setOffset(0); // Reset for potential undo or recycle
            }, 300);
        } else {
            // Snap back
            setOffset(0);
        }
        currentOffset.current = 0;
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Background Layer (Action) */}
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                <div className="flex flex-col items-center text-white">
                    <Archive size={20} />
                    <span className="text-[10px] font-bold uppercase mt-1">Archive</span>
                </div>
            </div>

            {/* Foreground Layer (Content) */}
            <div 
                className="relative bg-white transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};
