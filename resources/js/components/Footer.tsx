import React from 'react';
import { Link } from '@inertiajs/react';
import { Instagram, Send, Mail, Facebook, Music2, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        // 1. Main Container using your specific CSS variables for background and border
        <footer className="relative mt-8 pt-12 pb-8 border-t transition-colors duration-300
            bg-[var(--footer)] 
            border-[var(--footer-border)]"
        >
            {/* Decorative Top Gradient (Matches your White/Purple/Orange theme) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-orange-400 to-purple-500" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    
                    {/* Column 1: Brand Info */}
                    <div className="flex flex-col items-center md:items-start space-y-4">
                        {/* Brand Text with Gradient */}
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">
                            Eventra
                        </div>
                        <p className="text-sm text-center md:text-left max-w-xs leading-relaxed transition-colors duration-300 text-[var(--footer-text)] opacity-80">
                            Events Made Simpler, <span>Connections Made Stronger.</span>
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="flex flex-col items-center space-y-4">
                        <h3 className="font-semibold uppercase tracking-wider text-sm text-[var(--footer-text)]">
                            Quick Links
                        </h3>
                        <nav className="flex flex-col space-y-3 text-center">
                            <FooterLink href="/">Home</FooterLink>
                            <FooterLink href="/team">Our Team</FooterLink>
                            {/* Manual link for Contact */}
                            <a 
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=utmvolunteerclub@gmail.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium transition-colors duration-300 text-[var(--footer-text)] hover:text-orange-500"
                            >
                                Contact Us
                            </a>
                        </nav>
                    </div>

                    {/* Column 3: Socials */}
                    <div className="flex flex-col items-center md:items-end space-y-4">
                        <h3 className="font-semibold uppercase tracking-wider text-sm text-[var(--footer-text)]">
                            Connect With Us
                        </h3>
                        <div className="flex space-x-4">
                            <SocialIcon 
                                href="https://www.instagram.com/volunteer_utm?igsh=cmV5bm90eWp3cDh2" 
                                icon={<Instagram className="w-5 h-5" />} 
                                label="Instagram"
                            />
                            <SocialIcon 
                                href="https://www.tiktok.com/@volunteerutm?_r=1&_t=ZS-91QHke1nBUQ" 
                                icon={<Music2 className="w-5 h-5" />} 
                                label="TikTok"
                            />
                            <SocialIcon 
                                href="https://www.facebook.com/volunteerUTM" 
                                icon={<Facebook className="w-5 h-5" />} 
                                label="Facebook"
                            />
                            <SocialIcon 
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=utmvolunteerclub@gmail.com" 
                                icon={<Mail className="w-5 h-5" />} 
                                label="Email"
                            />
                        </div>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="border-t my-8 border-[var(--footer-line)]"></div>

                {/* Bottom: Copyright */}
                <div className="flex flex-col md:flex-row justify-between items-center text-sm transition-colors duration-300 text-[var(--footer-copyright)]">
                    <p>
                        Copyright &copy; 2025 <span className="font-semibold text-purple-600">Eventra</span>.
                    </p>
                    <p className="flex items-center mt-2 md:mt-0">
                        Made with <Heart className="w-4 h-4 mx-1 text-orange-500 fill-orange-500" /> by Eventra Team
                    </p>
                </div>
            </div>
        </footer>
    );
};

// --- Helper Components ---

const FooterLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link 
        href={href} 
        className="font-medium transition-colors duration-300 text-[var(--footer-text)] hover:text-orange-500"
    >
        {children}
    </Link>
);

const SocialIcon = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label={label}
        // Uses var(--footer-icon) for the default color
        className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm hover:shadow-md
            bg-purple-50/50 hover:bg-orange-500
            text-[var(--footer-icon)] hover:text-white"
    >
        {icon}
    </a>
);

export default Footer;