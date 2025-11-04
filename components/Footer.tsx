import React, { memo } from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative z-10 w-full py-16 bg-dark-bg/50 border-t border-dark-border/50">
            <div className="container mx-auto px-4 text-medium-text">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand Section */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-8 h-8" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M56 184L93.3333 136L128 156L165.333 92L200 116" stroke="#29ffb8" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-bold text-xl text-light-text">Crysi Scanner</span>
                        </div>
                        <p className="text-sm max-w-sm">
                            An advanced market analysis dashboard designed to give traders a real-time edge in the crypto markets.
                        </p>
                    </div>

                    {/* Links Section */}
                    <div>
                        <h4 className="font-bold text-light-text mb-4 uppercase tracking-wider text-sm">Resources</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">API Status</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                        </ul>
                    </div>

                    {/* Socials Section */}
                    <div>
                        <h4 className="font-bold text-light-text mb-4 uppercase tracking-wider text-sm">Community</h4>
                        <div className="flex items-center gap-5">
                            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="text-2xl hover:text-primary transition-colors" aria-label="X / Twitter">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" className="text-2xl hover:text-primary transition-colors" aria-label="Telegram">
                                <i className="fab fa-telegram"></i>
                            </a>
                            <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="text-2xl hover:text-primary transition-colors" aria-label="Discord">
                                <i className="fab fa-discord"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-dark-border text-center text-sm">
                    <p>&copy; {currentYear} Crysi Scanner. All Rights Reserved. Developed by <a href="https://x.com/resistance_aqsa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Resistance</a>.</p>
                </div>
            </div>
        </footer>
    );
};

export default memo(Footer);