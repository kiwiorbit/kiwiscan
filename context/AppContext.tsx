import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Settings, Timeframe, Theme, Notification, ViewMode, AppScreen, AlertConditions } from '../types';
import useUserSettings from '../hooks/useUserSettings';
import useNotifications from '../hooks/useNotifications';
import { fetchRsiForSymbol } from '../services/binanceService';
import { checkAllAlerts } from '../services/alertingService';

interface AppContextType {
    isInitializing: boolean;
    // User Settings
    settings: Settings;
    theme: Theme;
    favorites: string[];
    userSymbols: string[];
    allSymbols: string[];
    showFavoritesOnly: boolean;
    isConfluenceFilterActive: boolean;
    viewMode: ViewMode;
    handleSettingChange: (key: keyof Settings, value: any) => void;
    handleAlertConditionChange: (key: keyof AlertConditions, value: boolean) => void;
    handleColumnVisibilityChange: (key: string, value: boolean) => void;
    toggleFavorite: (symbol: string) => void;
    handleShowFavoritesOnlyToggle: () => void;
    handleToggleConfluenceFilter: () => void;
    handleSaveAssetList: (data: { allSymbols: string[]; selectedSymbols: string[]; }) => void;
    handleResetSettings: () => void;
    // Symbol Data
    timeframe: Timeframe;
    handleTimeframeChange: (tf: Timeframe) => void;
    // Notifications & Logs
    activeToast: Notification | null;
    notifications: Notification[];
    alertLog: Record<string, any>;
    handleClearAlertLog: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>, showToast?: boolean) => void;
    handleToastFinished: () => void;
    markNotificationsAsRead: () => void;
    clearNotifications: () => void;
    ToastContainer: React.FC<{ toast: Notification | null; onFinish: () => void; onClick?: (notification: Notification) => void; }>;
    handleNotificationClick: (notification: Notification) => void;
    // UI State
    scannerType: 'cex' | 'mexc';
    handleScannerTypeChange: (type: 'cex' | 'mexc') => void;
    appScreen: AppScreen;
    activeSymbol: string | null;
    activeSymbolSource: 'cex' | 'mexc';
    modalInitialState: Record<string, boolean>;
    isSettingsOpen: boolean;
    isAssetModalOpen: boolean;
    isAlertsModalOpen: boolean;
    isAlertLogOpen: boolean;
    isTableSettingsModalOpen: boolean;
    isChartModalOpen: boolean;
    isAutomationModalOpen: boolean;
    handleBackToScanner: () => void;
    handleSettingsToggle: () => void;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAssetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAlertsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAlertLogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsTableSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsChartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAutomationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    searchTerm: string;
    handleSearchChange: (term: string) => void;
    displayedSymbols: string[];
    // Auth & Subscription State
    isLocked: boolean;
    userAddress: string | null;
    connectWallet: (address: string) => void;
    disconnectWallet: () => void;
    isSubscribed: boolean;
    handleSubscribe: () => void;
    handleKiwiTrailCellClick: (symbol: string, timeframe: Timeframe, source: 'cex' | 'mexc') => void;
}


const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- Auth State ---
    const [userAddress, setUserAddress] = useState<string | null>(() => sessionStorage.getItem('userAddress'));
    const isLocked = !userAddress; 

    const connectWallet = useCallback((address: string) => {
        sessionStorage.setItem('userAddress', address);
        setUserAddress(address);
    }, []);

    const disconnectWallet = useCallback(() => {
        sessionStorage.removeItem('userAddress');
        setUserAddress(null);
    }, []);

    // --- UI State ---
    const [appScreen, setAppScreen] = useState<AppScreen>('scanner');
    const [scannerType, setScannerType] = useState<'cex' | 'mexc'>('cex');
    const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
    const [activeSymbolSource, setActiveSymbolSource] = useState<'cex' | 'mexc'>('cex');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [isAlertLogOpen, setIsAlertLogOpen] = useState(false);
    const [isTableSettingsModalOpen, setIsTableSettingsModalOpen] = useState(false);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitializing, setIsInitializing] = useState(() => !sessionStorage.getItem('hasSeenSplash'));
    const [modalInitialState, setModalInitialState] = useState<Record<string, boolean>>({});
    
    // --- Custom Hooks ---
    const { 
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, isConfluenceFilterActive,
        viewMode, timeframe, handleTimeframeChange, handleToggleConfluenceFilter, isSubscribed, handleSubscribe,
        ...userSettingsHandlers 
    } = useUserSettings(userAddress); // Pass userAddress to the hook
    
    const { notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer } = useNotifications();
    
    // --- Alert State ---
    const [alertStates, setAlertStates] = useState<Record<string, any>>(() => {
        try {
            const savedStates = localStorage.getItem('alertStates');
            return savedStates ? JSON.parse(savedStates) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => { localStorage.setItem('alertStates', JSON.stringify(alertStates)); }, [alertStates]);
    
    const handleClearAlertLog = () => {
        if (window.confirm("Are you sure you want to clear the entire alert log? This action cannot be undone.")) {
            setAlertStates({});
            clearNotifications(); // Also clear the user-facing notifications
            addNotification({
                symbol: 'System',
                timeframe: 'N/A' as Timeframe,
                type: 'accumulation-volume', // Re-use an existing style for success
                body: 'Alert Log & Notification History cleared.'
            }, true);
        }
    };

    // --- Effects ---
     useEffect(() => {
        if (isInitializing) {
            const timer = setTimeout(() => {
                setIsInitializing(false);
                sessionStorage.setItem('hasSeenSplash', 'true');
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [isInitializing]);
    
    // === Alerting Loop ===
    useEffect(() => {
        if (isLocked || isInitializing || !isSubscribed) return;

        const anyAlertsEnabled = Object.values(settings.alertConditions).some(Boolean);
        if (!anyAlertsEnabled || userSymbols.length === 0) return;

        const ALERT_CHECK_INTERVAL = 150000; // 2.5 minutes
        const controller = new AbortController();

        const checkAlerts = async () => {
            const alertTimeframes: Timeframe[] = ['15m', '1h', '4h', '1d'];

            for (const symbol of userSymbols) {
                if (controller.signal.aborted) return;
                
                for (const timeframe of alertTimeframes) {
                    if (controller.signal.aborted) return;
                    try {
                        const data = await fetchRsiForSymbol(symbol + '.P', timeframe, settings);
                        if (controller.signal.aborted) return;

                        const alertsToFire = checkAllAlerts(symbol, timeframe, data, settings, alertStates, setAlertStates);
                        alertsToFire.forEach(alert => {
                            addNotification(alert, true);

                            // --- NEW WEBHOOK LOGIC ---
                            if (settings.enableWebhooks && settings.webhookUrl) {
                                try {
                                    const payload = {
                                        ...alert,
                                        timestamp: Date.now()
                                    };
                                    // Fire and forget: send the webhook but don't wait for it or handle its response
                                    fetch(settings.webhookUrl, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    }).catch(error => console.error("Webhook failed to send:", error));
                                } catch (error) {
                                    console.error("Error preparing webhook:", error);
                                }
                            }
                        });
                    } catch (error) {
                        console.warn(`Error fetching alert data for ${symbol} on ${timeframe}:`, error);
                    }
                    // Pause between different timeframes for the same symbol
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                // Pause between different symbols
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        };

        const intervalId = setInterval(checkAlerts, ALERT_CHECK_INTERVAL);
        const initialCheckTimeout = setTimeout(checkAlerts, 5000); // Initial check after 5s

        return () => {
            clearInterval(intervalId);
            clearTimeout(initialCheckTimeout);
            controller.abort();
        };

    }, [settings, userSymbols, isLocked, isInitializing, isSubscribed, alertStates, addNotification]);


    // --- Derived State & Memos ---
    const displayedSymbols = useMemo(() => {
        let symbols = showFavoritesOnly ? favorites : userSymbols;
        if (searchTerm) {
            symbols = symbols.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return symbols;
    }, [showFavoritesOnly, favorites, userSymbols, searchTerm]);


    // --- UI Handlers ---
    const handleScannerTypeChange = (type: 'cex' | 'mexc') => {
        if (type !== scannerType) {
            setScannerType(type);
        }
    };

    const handleBackToScanner = useCallback(() => {
        setAppScreen('scanner');
        setActiveSymbol(null);
        setModalInitialState({});
    }, []);
    
    const handleSettingsToggle = () => setIsSettingsOpen(prev => !prev);
    const handleSearchChange = (term: string) => setSearchTerm(term);
    
    const handleSaveAndNotify = useCallback((data: { allSymbols: string[]; selectedSymbols: string[]; }) => {
        userSettingsHandlers.handleSaveAssetList(data);
        addNotification({
            symbol: 'System',
            timeframe: 'N/A' as Timeframe,
            type: 'accumulation-volume', // Re-use an existing style for success
            body: 'Asset list updated successfully.'
        }, true);
    }, [userSettingsHandlers, addNotification]);

    const openChartView = useCallback((symbol: string, tf: Timeframe, source: 'cex' | 'mexc', initialState: Record<string, boolean> = {}) => {
        handleTimeframeChange(tf);
        setActiveSymbol(symbol);
        setActiveSymbolSource(source);
        setModalInitialState(initialState);
        
        if (settings.chartViewMode === 'page') {
            setAppScreen('chart');
        } else {
            setIsChartModalOpen(true);
        }
    }, [settings.chartViewMode, handleTimeframeChange]);
    
    const handleNotificationClick = useCallback((notification: Notification) => {
        const initialState: Record<string, boolean> = {};
        
        if (notification.type.includes('luxalgo')) initialState.showTrailingStop = true;
        if (notification.type.includes('supertrend')) initialState.showSupertrend = true;

        handleToastFinished(); // Close the active toast immediately
        openChartView(notification.symbol, notification.timeframe, 'cex', initialState); // Notifications are always CEX for now
        
    }, [handleToastFinished, openChartView]);

    const handleKiwiTrailCellClick = useCallback((symbol: string, timeframe: Timeframe, source: 'cex' | 'mexc') => {
        openChartView(symbol, timeframe, source, { showTrailingStop: true });
    }, [openChartView]);
    
    const value: AppContextType = {
        isInitializing,
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, isConfluenceFilterActive, viewMode,
        ...userSettingsHandlers, 
        handleTimeframeChange,
        handleToggleConfluenceFilter,
        handleSaveAssetList: handleSaveAndNotify,
        timeframe,
        notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer,
        alertLog: alertStates,
        handleClearAlertLog,
        handleNotificationClick,
        scannerType,
        handleScannerTypeChange,
        appScreen,
        activeSymbol, activeSymbolSource, modalInitialState, isSettingsOpen, isAssetModalOpen, isAlertsModalOpen, isAlertLogOpen, isTableSettingsModalOpen,
        isChartModalOpen, isAutomationModalOpen,
        handleBackToScanner,
        handleSettingsToggle,
        setIsSettingsOpen, setIsAssetModalOpen, setIsAlertsModalOpen, setIsAlertLogOpen, setIsTableSettingsModalOpen, setIsChartModalOpen, setIsAutomationModalOpen,
        searchTerm, handleSearchChange,
        displayedSymbols,
        isLocked,
        userAddress,
        connectWallet,
        disconnectWallet,
        isSubscribed,
        handleSubscribe,
        handleKiwiTrailCellClick,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};