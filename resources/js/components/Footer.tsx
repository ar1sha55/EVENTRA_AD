import React from 'react';
import { Link } from '@inertiajs/react';
import {Instagram, Send, Mail, Facebook, Music2}from 'lucide-react';

// Define the style object using the CSS variables
const footerBgStyle = {
    backgroundColor: 'var(--footer)',
    color: 'var(--footer-text)', // Changed to use CSS variable
    borderTop: '1px solid var(--footer-border)',
    boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
};

// Define the style for the divider lines
const dividerStyle = {
    borderBottom: '1px solid var(--footer-border)',
};

// Define the hover color style
const hoverColorStyle = {
    color: 'var(--sidebar-ring)',
};

const Footer: React.FC = () => {
    return (
        <footer style={footerBgStyle} className="pt-6 mt-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Section: Icons and Contact */}
                <div 
                    className="flex flex-col items-center pb-4 mb-4"
                    style={dividerStyle}
                >
                    {/* Social Icons and Contact Links */}
                    <div className="flex items-center space-x-6">
                        {/* Instagram */}
                        <a 
                            href="https://www.instagram.com/volunteer_utm?igsh=cmV5bm90eWp3cDh2" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300" 
                            aria-label="Instagram"
                            onMouseOver={e => e.currentTarget.style.color = '#ec4899'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--footer-icon)'}
                            style={{ color: 'var(--footer-icon)' }}
                        >
                            <Instagram className="w-7 h-7" />
                        </a>
                        {/* TikTok */}
                        <a 
                            href="https://www.tiktok.com/@volunteerutm?_r=1&_t=ZS-91QHke1nBUQ" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300" 
                            aria-label="TikTok"
                            onMouseOver={e => e.currentTarget.style.color = '#00f2ea'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--footer-icon)'}
                            style={{ color: 'var(--footer-icon)' }}
                        >
                            <Music2 className="w-7 h-7" />
                        </a>
                        {/* Facebook */}
                        <a 
                            href="https://www.facebook.com/volunteerUTM" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300" 
                            aria-label="Facebook"
                            onMouseOver={e => e.currentTarget.style.color = '#60a5fa'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--footer-icon)'}
                            style={{ color: 'var(--footer-icon)' }}
                        >
                            <Facebook className="w-7 h-7" />
                        </a>
                        {/* Gmail Icon & Mailto Link */}
                        <a 
                            href="mailto:utmvolunteerclub@gmail.com" 
                            className="transition duration-300" 
                            aria-label="Gmail"
                            onMouseOver={e => e.currentTarget.style.color = '#dc2626'}
                            onMouseOut={e => e.currentTarget.style.color = 'var(--footer-icon)'}
                            style={{ color: 'var(--footer-icon)' }}
                        >
                            <Mail className="w-7 h-7" />
                        </a>
                    </div>
                </div>

                {/* Middle Section: Navigation Links (Home, Contact, Our Team) */}
                <div 
                    className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-12 py-4 my-4 text-lg font-semibold border-t border-b"
                    style={{ borderColor: 'var(--footer-line)' }}
                >
                    {/* Home Link */}
                    <Link 
                        href="/" 
                        className="transition duration-300 text-center"
                        style={{ color: 'var(--footer-text)' }}
                        onMouseOver={e => e.currentTarget.style.color = hoverColorStyle.color as string}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--footer-text)'}
                    >
                        Home
                    </Link>
                    {/* Contact Link */}
                    <Link 
                        href="/contact" 
                        className="transition duration-300 text-center"
                        style={{ color: 'var(--footer-text)' }}
                        onMouseOver={e => e.currentTarget.style.color = hoverColorStyle.color as string}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--footer-text)'}
                    >
                        Contact
                    </Link>
                    {/* Our Team Link */}
                    <Link 
                        href="/team" 
                        className="transition duration-300 text-center"
                        style={{ color: 'var(--footer-text)' }}
                        onMouseOver={e => e.currentTarget.style.color = hoverColorStyle.color as string}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--footer-text)'}
                    >
                        Our Team
                    </Link>
                </div>

                {/* Bottom Section: Copyright */}
                <div className="text-center py-3">
                    <p style={{ color: 'var(--footer-copyright)' }} className="text-xs">
                        Copyright &copy; 2025: Designed by Eventra
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;