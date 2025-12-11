import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import ChatPopup from './ChatPopup';

const ChatButton: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <>
            {/* Chatbot button - always visible */}
            <div className="fixed bottom-4 right-4 z-50 group">
                <Button
                    onClick={toggleChat}
                    className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-105 relative overflow-hidden"
                >
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Icon */}
                    <MessageCircle size={32} className="relative z-10 transition-transform duration-300 group-hover:rotate-12" />

                    {/* Active indicator badge - only show when chat is closed */}
                    {!isChatOpen && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"></span>
                        </span>
                    )}
                </Button>
            </div>
            <ChatPopup isOpen={isChatOpen} onClose={toggleChat} />
        </>
    );
};

export default ChatButton;
