import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { usePage } from '@inertiajs/react';

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
    timestamp?: Date;
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            role: 'member' | 'manager' | 'admin';
        };
    };
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose }) => {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    // LocalStorage key unique to each user
    const STORAGE_KEY = user ? `eventra_chat_${user.id}` : 'eventra_chat_guest';

    // Role-specific welcome message
    const getWelcomeMessage = () => {
        if (!user) return 'Hi! I am EventraBot. How can I help you today?';

        const name = user.name.split(' ')[0]; // First name only

        if (user.role === 'admin') {
            return `Welcome back, ${name}! As an admin, I can help you manage the platform, oversee events, and assist with system controls. What do you need?`;
        } else if (user.role === 'manager') {
            return `Hi ${name}! I'm here to help you manage your events, track participants, and analyze your event performance. How can I assist you today?`;
        } else {
            return `Hey ${name}! Ready to discover amazing events? I can help you find events, check your registrations, or answer any questions you have.`;
        }
    };

    // Conversation starters based on role
    const getQuickReplies = (): string[] => {
        if (!user) return [];

        if (user.role === 'admin') {
            return [
                'Show my dashboard stats',
                'How do I manage events?',
                'View analytics',
                'Help with admin tasks'
            ];
        } else if (user.role === 'manager') {
            return [
                'Show my event stats',
                'How do I create an event?',
                'Check pending approvals',
                'How to manage participants?'
            ];
        } else {
            return [
                '🎯 Recommend events for me',
                'Show upcoming events',
                'Check my registrations',
                'How do I register for events?',
                'How do I make payment?'
            ];
        }
    };

    // Load messages from localStorage on mount
    const loadMessages = (): Message[] => {
        try {
            // First, clean up chat history from other users on this device
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (key.startsWith('eventra_chat_') && key !== STORAGE_KEY) {
                    // Remove chat history from other users
                    localStorage.removeItem(key);
                }
            });

            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert timestamp strings back to Date objects
                return parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
                }));
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
        return [{ sender: 'bot', text: getWelcomeMessage(), timestamp: new Date() }];
    };

    const [messages, setMessages] = useState<Message[]>(loadMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Format timestamp
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Save messages to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }, [messages, STORAGE_KEY]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { sender: 'user', text: textToSend, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            const response = await axios.post('/chat', { message: textToSend });
            setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply, timestamp: new Date() }]);
        } catch (error: any) {
            console.error('Error sending message:', error);
            const reply = error.response?.data?.reply || 'Sorry, I am having trouble connecting right now. Please try again or [contact support](/contact-support).';
            setMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickReply = (reply: string) => {
        handleSend(reply);
    };

    const clearChat = () => {
        const welcomeMsg = [{ sender: 'bot', text: getWelcomeMessage(), timestamp: new Date() }];
        setMessages(welcomeMsg);
        // Clear localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(welcomeMsg));
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
        // Clear server-side session history
        axios.post('/chat/clear').catch(() => {});
    };

    // Clear chat history on logout
    useEffect(() => {
        const handleInertiaVisit = (event: any) => {
            // Check if navigating to logout route
            const url = event.detail?.visit?.url?.href || event.detail?.url || '';
            if (url.includes('/logout')) {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                    console.log('Chat history cleared on logout');
                } catch (error) {
                    console.error('Error clearing chat on logout:', error);
                }
            }
        };

        // Listen for Inertia navigation (before the page changes)
        document.addEventListener('inertia:before', handleInertiaVisit);

        return () => {
            document.removeEventListener('inertia:before', handleInertiaVisit);
        };
    }, [STORAGE_KEY]);

    if (!isOpen) return null;

    const quickReplies = getQuickReplies();

    return (
        <div className="fixed bottom-24 right-4 z-50 w-80 h-[550px] bg-white rounded-xl shadow-2xl flex flex-col border border-purple-200 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl text-white">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-md">EventraBot</h3>
                        <span className="text-xs text-purple-100">AI-Powered Assistant</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Button
                        onClick={clearChat}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-purple-700 text-white p-1"
                        title="Clear chat"
                    >
                        <Trash2 size={16} />
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="hover:bg-purple-700 text-white p-1"
                    >
                        <X size={20} />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-purple-50/30 to-gray-50">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex flex-col mb-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`p-3 max-w-[85%] rounded-lg text-sm shadow-sm ${
                                msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-purple-100 rounded-bl-none'
                            }`}
                        >
                            <ReactMarkdown
                                components={{
                                    a: ({node, ...props}) => (
                                        <a
                                            {...props}
                                            className={`underline font-semibold ${
                                                msg.sender === 'user' ? 'text-purple-100 hover:text-white' : 'text-purple-600 hover:text-purple-800'
                                            }`}
                                            target="_self"
                                        />
                                    ),
                                    strong: ({node, ...props}) => (
                                        <strong {...props} className="font-bold" />
                                    ),
                                    p: ({node, ...props}) => (
                                        <p {...props} className="mb-2 last:mb-0" />
                                    ),
                                    ul: ({node, ...props}) => (
                                        <ul {...props} className="list-disc list-inside mb-2 space-y-1" />
                                    ),
                                    ol: ({node, ...props}) => (
                                        <ol {...props} className="list-decimal list-inside mb-2 space-y-1" />
                                    ),
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                        {msg.timestamp && (
                            <span className={`text-[10px] text-gray-400 mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {formatTime(msg.timestamp)}
                            </span>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-3">
                        <div className="bg-white border border-purple-200 p-3 rounded-lg rounded-bl-none flex items-center space-x-2 shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600 font-medium">EventraBot is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Section - Always Visible */}
            {quickReplies.length > 0 && (
                <div className="bg-white border-t border-purple-100 px-3 py-2.5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-700">⚡ Quick Actions</span>
                        <span className="text-[10px] text-gray-400">Click to send</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {quickReplies.map((reply, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickReply(reply)}
                                disabled={isLoading}
                                className="flex-shrink-0 px-3 py-2 text-xs bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 transition-all hover:shadow-md shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-purple-100 rounded-b-xl">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="flex-1 p-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                    />
                    <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className={`rounded-lg p-2 transition-all ${
                            isLoading || !input.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <Send size={18} className="text-white" />
                    </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                    Powered by Gemini AI • Press Enter to send
                </p>
            </div>
        </div>
    );
};

export default ChatPopup;