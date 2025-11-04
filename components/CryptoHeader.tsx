import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import type { Notification } from '../types';
import NotificationPanel from './NotificationPanel';
import { useAppContext } from '../context/AppContext';

interface CryptoHeaderProps {
    onSettingsToggle: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    notifications: Notification[];
    onClearNotifications: () => void;
    onMarkNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    showFavoritesOnly: boolean;
    onShowFavoritesOnlyToggle: () => void;
    isConfluenceFilterActive: boolean;
    onToggleConfluenceFilter: () => void;
    scannerType: 'cex' | 'mexc';
    onScannerTypeChange: (type: 'cex' | 'mexc') => void;
}

const CryptoHeader: React.FC<CryptoHeaderProps> = ({
    onSettingsToggle,
    searchTerm,
    onSearchChange,
    notifications,
    onClearNotifications,
    onMarkNotificationsRead,
    onNotificationClick,
    showFavoritesOnly,
    onShowFavoritesOnlyToggle,
    isConfluenceFilterActive,
    onToggleConfluenceFilter,
    scannerType,
    onScannerTypeChange,
}) => {
    const { userAddress, disconnectWallet } = useAppContext();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const headerContainerRef = useRef<HTMLDivElement>(null);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const handleToggleNotificationPanel = () => {
        if (!isNotificationPanelOpen) {
            onMarkNotificationsRead();
        }
        setIsNotificationPanelOpen(prev => !prev);
    };

    const handleToggleSearch = () => {
        if (isSearchOpen) {
            onSearchChange('');
        }
        setIsSearchOpen(!isSearchOpen);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!headerContainerRef.current) return;
        const rect = headerContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        headerContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
        headerContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    useEffect(() => {
        if (isSearchOpen) {
            const timer = setTimeout(() => searchInputRef.current?.focus(), 150);
            return () => clearTimeout(timer);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
                onSearchChange('');
            }
            if (isNotificationPanelOpen && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationPanelOpen(false);
            }
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isSearchOpen) {
                    setIsSearchOpen(false);
                    onSearchChange('');
                }
                if (isNotificationPanelOpen) {
                    setIsNotificationPanelOpen(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isSearchOpen, isNotificationPanelOpen, onSearchChange]);

    const truncatedAddress = userAddress ? `${userAddress.slice(0, 5)}...${userAddress.slice(-4)}` : '';

    return (
        <header className="fixed top-0 left-0 right-0 p-4 z-30 header-on-load">
            <div
                ref={headerContainerRef}
                onMouseMove={handleMouseMove}
                className="interactive-header-container relative bg-dark-card/30 backdrop-blur-xl border border-dark-border/30 rounded-2xl transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/20 hover:border-primary/80"
            >
                <div className="relative z-10 p-4 flex flex-col md:flex-row items-center md:justify-between gap-4">
                     <div className="flex items-center gap-3 justify-center md:justify-start header-title-group">
                        <div className="text-center md:text-left">
                            <h1 className="text-xl font-bold text-light-text tracking-tight">Crysi Scanner</h1>
                        </div>
                        <div className="flex bg-dark-bg p-1 rounded-lg">
                            <button
                                onClick={() => onScannerTypeChange('cex')}
                                className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${scannerType === 'cex' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}
                            >
                                BINANCE
                            </button>
                            <button
                                onClick={() => onScannerTypeChange('mexc')}
                                className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${scannerType === 'mexc' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}
                            >
                                MEXC
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-4 header-controls-group">
                        {userAddress && (
                            <button
                                onClick={disconnectWallet}
                                className="group flex items-center gap-2 bg-dark-bg rounded-lg pl-3 pr-2 py-2 border border-dark-border shadow-sm hover:border-red-500/50 transition-colors"
                                aria-label="Disconnect wallet"
                                title="Disconnect Wallet"
                            >
                                <i className="fa-solid fa-wallet text-primary/80"></i>
                                <span className="text-sm font-mono text-primary">{truncatedAddress}</span>
                                <i className="fa-solid fa-right-from-bracket text-medium-text group-hover:text-red-500 transition-colors"></i>
                            </button>
                        )}
                        <button
                            onClick={onShowFavoritesOnlyToggle}
                            className={`bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border shadow-sm hover:bg-dark-border transition ${showFavoritesOnly ? 'border-primary text-primary' : 'border-dark-border text-primary/70'}`}
                            aria-pressed={showFavoritesOnly}
                            aria-label="Toggle favorites filter"
                            title="Filter Favorites"
                        >
                            <i className={`fa-star text-[22px] ${showFavoritesOnly ? 'fa-solid' : 'fa-regular'}`}></i>
                        </button>
                        <button
                            onClick={onToggleConfluenceFilter}
                            className={`bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border shadow-sm hover:bg-dark-border transition ${isConfluenceFilterActive ? 'border-primary text-primary' : 'border-dark-border text-primary/70'}`}
                            aria-pressed={isConfluenceFilterActive}
                            aria-label="Toggle confluence filter"
                            title="Filter Confluence Signals"
                        >
                            <i className={`fa-solid fa-fire text-[22px]`}></i>
                        </button>
                        <button
                            onClick={onSettingsToggle}
                            className="bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-dark-border shadow-sm hover:bg-dark-border transition"
                            aria-label="Open settings"
                        >
                            <i className="fa-solid fa-gear text-primary text-[22px]"></i>
                        </button>
                        
                        <div ref={notificationRef} className="relative">
                             <button
                                id="notification-bell-btn"
                                onClick={handleToggleNotificationPanel}
                                className="relative bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-dark-border shadow-sm hover:bg-dark-border transition"
                                aria-label="Open notifications"
                            >
                                <i className="fa-solid fa-bell text-primary text-[22px]"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot border-2 border-dark-card"></span>
                                )}
                            </button>
                            <NotificationPanel
                                isOpen={isNotificationPanelOpen}
                                notifications={notifications}
                                onClear={() => {
                                    onClearNotifications();
                                    setIsNotificationPanelOpen(false);
                                }}
                                onNotificationClick={onNotificationClick}
                            />
                        </div>

                        <div ref={searchRef} className="relative flex items-center justify-end">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className={`h-[42px] rounded-lg bg-dark-bg pl-4 pr-12 text-light-text outline-none border border-dark-border focus:ring-2 focus:ring-primary absolute right-0 top-0 transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-40 sm:w-48 opacity-100' : 'w-10 opacity-0 pointer-events-none'}`}
                            />
                            <button
                                onClick={handleToggleSearch}
                                className="relative z-10 bg-dark-bg rounded-lg p-2 w-[42px] h-[42px] flex items-center justify-center border border-dark-border shadow-sm hover:bg-dark-border transition"
                                aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                            >
                                <i className={`fa-solid ${isSearchOpen ? 'fa-xmark' : 'fa-search'} text-primary text-[20px] transition-transform duration-300 ease-in-out ${isSearchOpen ? 'rotate-180' : 'rotate-0'}`}></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default memo(CryptoHeader);