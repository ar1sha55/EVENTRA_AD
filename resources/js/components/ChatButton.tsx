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
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    onClick={toggleChat}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 relative"
                >
                    <MessageCircle size={32} />
                    {/* Pulse animation ring */}
                    <span className="absolute inset-0 rounded-full bg-purple-400 opacity-75 animate-ping"></span>
                </Button>
            </div>
            <ChatPopup isOpen={isChatOpen} onClose={toggleChat} />
        </>
    );
};

export default ChatButton;
