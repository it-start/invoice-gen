
import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { analyzeChatIntent, ChatSuggestion } from '../../services/geminiService';
import { Wand2, MessageSquare, Zap, Loader2 } from 'lucide-react';

interface SmartActionBarProps {
    messages: ChatMessage[];
    domain?: string;
    onSuggestionClick: (text: string) => void;
}

export const SmartActionBar: React.FC<SmartActionBarProps> = ({ messages, domain = 'vehicle', onSuggestionClick }) => {
    const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        
        // Only trigger analysis if the last message is from the "other" person (Renter)
        // and it's a text message (not system)
        if (lastMessage && lastMessage.senderId !== 'me' && lastMessage.senderId !== 'system' && lastMessage.type === 'text') {
            const fetchSuggestions = async () => {
                setLoading(true);
                setVisible(true);
                // Slight delay to simulate "thinking" and avoid jitter
                const result = await analyzeChatIntent(messages, domain);
                setSuggestions(result);
                setLoading(false);
            };
            
            // Debounce slightly to prevent double-firing
            const timer = setTimeout(fetchSuggestions, 500);
            return () => clearTimeout(timer);
        } else {
            // Hide if I just replied
            if (lastMessage && lastMessage.senderId === 'me') {
                setVisible(false);
            }
        }
    }, [messages.length]); // Only re-run when message count changes

    if (!visible) return null;

    return (
        <div className="px-4 pb-2 bg-white/50 backdrop-blur-sm border-t border-slate-100/50">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-purple-500 uppercase tracking-wider mr-2 animate-pulse">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    {loading ? 'Analyzing...' : 'AI Suggestions'}
                </div>

                {!loading && suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion.text)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all active:scale-95 animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-forwards
                            ${suggestion.type === 'action' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                            }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {suggestion.type === 'action' ? <Zap size={12} /> : <MessageSquare size={12} />}
                        {suggestion.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
