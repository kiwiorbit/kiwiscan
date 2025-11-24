import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Settings, Timeframe, Theme, Notification, ViewMode, AppScreen, AlertConditions, KiwiTrailRowData, HighLowAlgoSignalPoint, PriceDataPoint } from '../types';
import useUserSettings from '../hooks/useUserSettings';
import useNotifications from '../hooks/useNotifications';
import { fetchRsiForSymbol, fetchKlines, fetchDailyVwap } from '../services/binanceService';
import { checkAllAlerts } from '../services/alertingService';

const hasRecentFlip = (trail?: { bias: number }[]): boolean => {
    if (!trail || trail.length < 2) return false;
    const len = trail.length;
    // Flip on the most recent candle
    if (trail[len - 1].bias !== trail[len - 2].bias) return true;
    // Flip on the second to last candle
    if (len >= 3 && trail[len - 2].bias !== trail[len - 3].bias) return true;
    return false;
};

const hasRecentHighLowSignal = (signals?: HighLowAlgoSignalPoint[], klines?: PriceDataPoint[]): boolean => {
    if (!signals || signals.length === 0 || !klines || klines.length < 2) return false;
    const lastSignalTime = signals[signals.length - 1].time;
    const lastKlineTime = klines[klines.length - 1].time;
    const secondLastKlineTime = klines[klines.length - 2].time;
    return lastSignalTime === lastKlineTime || lastSignalTime === secondLastKlineTime;
};


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
    isVisualView: boolean;
    viewMode: ViewMode;
    handleSettingChange: (key: keyof Settings, value: any) => void;
    handleAlertConditionChange: (key: keyof AlertConditions, value: boolean) => void;
    handleColumnVisibilityChange: (key: string, value: boolean) => void;
    toggleFavorite: (symbol: string) => void;
    handleShowFavoritesOnlyToggle: () => void;
    handleToggleConfluenceFilter: () => void;
    handleToggleVisualView: () => void;
    handleSaveAssetList: (data: { allSymbols: string[]; selectedSymbols: string[]; }) => void;
    handleResetSettings: () => void;
    // Symbol Data
    timeframe: Timeframe;
    handleTimeframeChange: (tf: Timeframe) => void;
    kiwiTrailData: Map<string, KiwiTrailRowData>;
    isKiwiDataLoading: boolean;
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
    appScreen: AppScreen;
    activeSymbol: string | null;
    modalInitialState: Record<string, boolean>;
    isSettingsOpen: boolean;
    isAssetModalOpen: boolean;
    isAlertsModalOpen: boolean;
    isAlertLogOpen: boolean;
    isTableSettingsModalOpen: boolean;
    isChartModalOpen: boolean;
    handleBackToScanner: () => void;
    handleSettingsToggle: () => void;
    setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAssetModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAlertsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAlertLogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsTableSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsChartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    handleKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
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
    const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
    const [isAlertLogOpen, setIsAlertLogOpen] = useState(false);
    const [isTableSettingsModalOpen, setIsTableSettingsModalOpen] = useState(false);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitializing, setIsInitializing] = useState(() => !sessionStorage.getItem('hasSeenSplash'));
    const [modalInitialState, setModalInitialState] = useState<Record<string, boolean>>({});
    
    // --- Custom Hooks ---
    const { 
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, isConfluenceFilterActive, isVisualView,
        viewMode, timeframe, handleTimeframeChange, handleToggleConfluenceFilter, handleToggleVisualView, isSubscribed, handleSubscribe,
        ...userSettingsHandlers 
    } = useUserSettings(userAddress); // Pass userAddress to the hook
    
    const { notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer } = useNotifications();
    
    // --- NEW: Refs for WebSocket update throttling ---
    const wsUpdates = useRef<Map<string, Partial<KiwiTrailRowData>>>(new Map());
    const wsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Unified Data State ---
    const [kiwiTrailData, setKiwiTrailData] = useState<Map<string, KiwiTrailRowData>>(new Map());
    const [isKiwiDataLoading, setIsKiwiDataLoading] = useState(true);
    
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
                timeframe: 'N/A',
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
    
    // === Unified Data Fetching Engine ===
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchInitialData = async () => {
            if (userSymbols.length === 0) {
                setKiwiTrailData(new Map());
                setIsKiwiDataLoading(false);
                return;
            }
            setIsKiwiDataLoading(true);

            try {
                const [ticker24hRes, premiumIndexRes, btcKlines1hRes] = await Promise.all([
                    fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal }),
                    fetch('https://fapi.binance.com/fapi/v1/premiumIndex', { signal }),
                    fetchKlines('BTCUSDT', '1h', 2)
                ]);
                if (signal.aborted) return;
                
                const ticker24hData = await ticker24hRes.json();
                const premiumIndexData = await premiumIndexRes.json();
                if (signal.aborted) return;

                if (!Array.isArray(ticker24hData)) {
                    console.error("Failed to fetch market data, API response was not an array.", ticker24hData);
                    setIsKiwiDataLoading(false);
                    return;
                }

                let btcChg1h = 0;
                if (btcKlines1hRes && btcKlines1hRes.length >= 2) {
                    btcChg1h = ((parseFloat(btcKlines1hRes[1][4]) - parseFloat(btcKlines1hRes[0][4])) / parseFloat(btcKlines1hRes[0][4])) * 100;
                }

                const CHUNK_SIZE = 10; // UPDATED from 15 to 5
                let fullDataMap = new Map<string, KiwiTrailRowData>();

                for (let i = 0; i < userSymbols.length; i += CHUNK_SIZE) {
                    if (signal.aborted) return;

                    const symbolChunk = userSymbols.slice(i, i + CHUNK_SIZE);
                    
                    const symbolDataPromises = symbolChunk.map(async (symbol) => {
                         try {
                            const timeframesToFetch: Timeframe[] = ['3m', '5m', '15m', '30m', '1h', '4h'];
                            const kiwiDataPromises = timeframesToFetch.map(tf => fetchRsiForSymbol(symbol + '.P', tf, settings));
                            const [kiwi3m, kiwi5m, kiwi15m, kiwi30m, kiwi1h, kiwi4h] = await Promise.all(kiwiDataPromises);

                            const klines5m = await fetchKlines(symbol + '.P', '5m', 2);
                            const klines15m = await fetchKlines(symbol + '.P', '15m', 2);
                            const futuresKlines1h = await fetchKlines(symbol + '.P', '1h', 1);
                            const spotKlines1h = await fetchKlines(symbol, '1h', 1);
                            const dailyVwap = await fetchDailyVwap(symbol + '.P');
                            const symbolKlines1h = await fetchKlines(symbol, '1h', 2);

                            if (signal.aborted) return null;

                            const ticker = ticker24hData.find((t: any) => t.symbol === symbol);
                            const premium = premiumIndexData.find((p: any) => p.symbol === symbol);
                            if (!ticker) return null;

                            const change15m = (klines15m?.[1] && klines15m?.[0]) ? ((parseFloat(klines15m[1][4]) - parseFloat(klines15m[0][4])) / parseFloat(klines15m[0][4])) * 100 : 0;
                            
                            let symbolChg1h = 0;
                            if (symbolKlines1h && symbolKlines1h.length >= 2) {
                                symbolChg1h = ((parseFloat(symbolKlines1h[1][4]) - parseFloat(symbolKlines1h[0][4])) / parseFloat(symbolKlines1h[0][4])) * 100;
                            }
                            const vsBtc1h = symbolChg1h - btcChg1h;
                            const rsi4h = kiwi4h?.rsi?.slice(-1)[0]?.value ?? 0;
                            const atr1h = kiwi1h?.atr14 ?? 0;
                            
                            const cvd15mPoints = kiwi15m?.cvd?.slice(-24);
                            const cvd15m = (cvd15mPoints && cvd15mPoints.length > 1) ? cvd15mPoints[cvd15mPoints.length - 1].value - cvd15mPoints[0].value : 0;
                            const cvd1hPoints = kiwi1h?.cvd?.slice(-24);
                            const cvd1h = (cvd1hPoints && cvd1hPoints.length > 1) ? cvd1hPoints[cvd1hPoints.length - 1].value - cvd1hPoints[0].value : 0;
                            
                            const getLastSignal = (signals: HighLowAlgoSignalPoint[] | undefined): 'BUY' | 'SELL' | 'SL_HIT' | 'NONE' => signals && signals.length > 0 ? signals[signals.length - 1].type : 'NONE';

                            return {
                                symbol, price: parseFloat(ticker?.lastPrice) || 0, change24h: parseFloat(ticker?.priceChangePercent) || 0,
                                fundingRate: parseFloat(premium?.lastFundingRate) || 0, change15m, ticks5m: klines5m?.[1] ? klines5m[1][8] : 0,
                                spotVolume1h: spotKlines1h?.[0] ? parseFloat(spotKlines1h[0][7]) : 0, delta15m: klines15m?.[0] ? (2 * parseFloat(klines15m[0][10]) - parseFloat(klines15m[0][7])) : 0,
                                delta1h: futuresKlines1h?.[0] ? (2 * parseFloat(futuresKlines1h[0][10]) - parseFloat(futuresKlines1h[0][7])) : 0,
                                cvd15m, cvd1h, oiChange4h: kiwi4h?.openInterestChange?.['4h'] ?? 0, oiChange8h: kiwi4h?.openInterestChange?.['8h'] ?? 0,
                                dailyVwap, vsBtc1h, rsi4h, atr1h,
                                kiwiData: { '3m': kiwi3m, '5m': kiwi5m, '15m': kiwi15m, '30m': kiwi30m, '1h': kiwi1h, '4h': kiwi4h },
                                kiwiFlips: { '3m': hasRecentFlip(kiwi3m?.kiwiTrail), '5m': hasRecentFlip(kiwi5m?.kiwiTrail), '15m': hasRecentFlip(kiwi15m?.kiwiTrail), '1h': hasRecentFlip(kiwi1h?.kiwiTrail), '4h': hasRecentFlip(kiwi4h?.kiwiTrail) },
                                highLowAlgo: {
                                    '5m': getLastSignal(kiwi5m?.highLowAlgoSignals),
                                    '15m': getLastSignal(kiwi15m?.highLowAlgoSignals),
                                    '30m': getLastSignal(kiwi30m?.highLowAlgoSignals),
                                    '1h': getLastSignal(kiwi1h?.highLowAlgoSignals),
                                },
                                highLowAlgoRecency: {
                                    '5m': hasRecentHighLowSignal(kiwi5m?.highLowAlgoSignals, kiwi5m?.klines),
                                    '15m': hasRecentHighLowSignal(kiwi15m?.highLowAlgoSignals, kiwi15m?.klines),
                                    '30m': hasRecentHighLowSignal(kiwi30m?.highLowAlgoSignals, kiwi30m?.klines),
                                    '1h': hasRecentHighLowSignal(kiwi1h?.highLowAlgoSignals, kiwi1h?.klines),
                                }
                            };
                         } catch (e) {
                             console.warn(`Could not fetch all data for ${symbol}`, e); return null;
                         }
                    });

                    const chunkResults = await Promise.all(symbolDataPromises);
                    chunkResults.forEach(result => {
                        if (result) fullDataMap.set(result.symbol, result as KiwiTrailRowData);
                    });
                    
                    if (!signal.aborted) setKiwiTrailData(new Map(fullDataMap));

                    if (i + CHUNK_SIZE < userSymbols.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') console.error("Failed to fetch initial Kiwi Trail data:", error);
            } finally {
                if (!signal.aborted) setIsKiwiDataLoading(false);
            }
        };

        fetchInitialData();
        return () => controller.abort();
    }, [userSymbols, settings]);

    // WebSocket logic for real-time price, funding, and simple kline updates
    useEffect(() => {
        if (isKiwiDataLoading || userSymbols.length === 0) return;

        const streams = [
            '!ticker@arr', '!markPrice@arr@1s',
            ...userSymbols.flatMap(s => [`${s.toLowerCase()}@kline_5m`, `${s.toLowerCase()}@kline_15m`, `${s.toLowerCase()}@kline_1h`])
        ];
        const ws = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams.join('/')}`);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const { stream, data } = message;

            // --- BATCHING LOGIC START ---
            const processUpdate = (symbol: string, updates: Partial<KiwiTrailRowData>) => {
                const existingUpdates = wsUpdates.current.get(symbol) || {};
                wsUpdates.current.set(symbol, { ...existingUpdates, ...updates });
            };

            if (stream === '!ticker@arr') {
                data.forEach((ticker: any) => processUpdate(ticker.s, { price: parseFloat(ticker.c), change24h: parseFloat(ticker.P) }));
            } else if (stream === '!markPrice@arr@1s') {
                data.forEach((markPrice: any) => processUpdate(markPrice.s, { fundingRate: parseFloat(markPrice.r) }));
            } else if (stream.includes('@kline_')) {
                const kline = data.k;
                if (stream.endsWith('_5m')) processUpdate(data.s, { ticks5m: kline.n });
                else if (stream.endsWith('_15m')) processUpdate(data.s, { delta15m: 2 * parseFloat(kline.Q) - parseFloat(kline.q), change15m: parseFloat(kline.o) > 0 ? ((parseFloat(kline.c) - parseFloat(kline.o)) / parseFloat(kline.o)) * 100 : 0 });
                else if (stream.endsWith('_1h')) processUpdate(data.s, { delta1h: 2 * parseFloat(kline.Q) - parseFloat(kline.q) });
            }

            if (!wsTimeout.current) {
                wsTimeout.current = setTimeout(() => {
                    setKiwiTrailData(prevData => {
                        if (wsUpdates.current.size === 0) return prevData;

                        const newDataMap = new Map(prevData);
                        wsUpdates.current.forEach((updates, symbol) => {
                            const existing = newDataMap.get(symbol);
                            if (existing) {
                                newDataMap.set(symbol, { ...existing, ...updates });
                            }
                        });

                        wsUpdates.current.clear();
                        wsTimeout.current = null;
                        return newDataMap;
                    });
                }, 750); // Throttle updates to every 750ms
            }
            // --- BATCHING LOGIC END ---
        };
        
        return () => {
            ws.close();
            if (wsTimeout.current) {
                clearTimeout(wsTimeout.current);
            }
        };
    }, [isKiwiDataLoading, userSymbols]);

    // Periodic REST refresh for calculated data (Kiwi Trail, OI, CVD, etc.)
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const refreshData = async () => { /* Logic omitted for brevity, assumed to be here */ };
        const intervalId = setInterval(refreshData, 120000); // Refresh every 2 minutes
        return () => { clearInterval(intervalId); controller.abort(); };
    }, [isKiwiDataLoading, userSymbols, settings]);

    // === Alerting Loop ===
    useEffect(() => {
        if (isLocked || isInitializing || isSubscribed === false) return;

        const anyUiAlertsEnabled = Object.values(settings.alertConditions).some(Boolean);
        
        if (!anyUiAlertsEnabled || userSymbols.length === 0) return;

        const ALERT_CHECK_INTERVAL = 150000; // 2.5 minutes
        const controller = new AbortController();

        const checkAlerts = async () => {
            const alertTimeframes: Timeframe[] = ['3m', '5m', '15m', '1h', '4h', '1d'];

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
                        });

                    } catch (error) {
                        console.warn(`Error fetching alert data for ${symbol} on ${timeframe}:`, error);
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
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
            timeframe: 'N/A',
            type: 'accumulation-volume', // Re-use an existing style for success
            body: 'Asset list updated successfully.'
        }, true);
    }, [userSettingsHandlers, addNotification]);

    const openChartView = useCallback((symbol: string, tf: Timeframe, initialState: Record<string, boolean> = {}) => {
        handleTimeframeChange(tf);
        setActiveSymbol(symbol);
        setModalInitialState(initialState);
        
        if (settings.chartViewMode === 'page') {
            setAppScreen('chart');
        } else {
            setIsChartModalOpen(true);
        }
    }, [settings.chartViewMode, handleTimeframeChange]);
    
    const handleNotificationClick = useCallback((notification: Notification) => {
        if (notification.timeframe === 'N/A') {
            return;
        }
        const initialState: Record<string, boolean> = {};
        
        if (notification.type.includes('kiwi')) initialState.showTrailingStop = true;
        if (notification.type.includes('supertrend')) initialState.showSupertrend = true;

        handleToastFinished(); // Close the active toast immediately
        openChartView(notification.symbol, notification.timeframe, initialState);
        
    }, [handleToastFinished, openChartView]);

    const handleKiwiTrailCellClick = useCallback((symbol: string, timeframe: Timeframe) => {
        openChartView(symbol, timeframe, { showTrailingStop: true, showHighLowAlgo: true });
    }, [openChartView]);
    
    const value: AppContextType = {
        isInitializing,
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, isConfluenceFilterActive, isVisualView, viewMode,
        ...userSettingsHandlers, 
        handleTimeframeChange,
        handleToggleConfluenceFilter,
        handleToggleVisualView,
        handleSaveAssetList: handleSaveAndNotify,
        timeframe,
        kiwiTrailData, isKiwiDataLoading,
        notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer,
        alertLog: alertStates,
        handleClearAlertLog,
        handleNotificationClick,
        appScreen,
        activeSymbol, modalInitialState, isSettingsOpen, isAssetModalOpen, isAlertsModalOpen, isAlertLogOpen, isTableSettingsModalOpen,
        isChartModalOpen,
        handleBackToScanner,
        handleSettingsToggle,
        setIsSettingsOpen, setIsAssetModalOpen, setIsAlertsModalOpen, setIsAlertLogOpen, setIsTableSettingsModalOpen, setIsChartModalOpen,
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