import { useState, useEffect, useCallback } from 'react';
import type { Theme, Settings, ViewMode, Timeframe, AlertConditions } from '../types';
import { DARK_THEME_SETTINGS, DEFAULT_SYMBOLS, SECONDARY_SYMBOLS, TERTIARY_SYMBOLS } from '../constants';

const getInitialState = <T,>(key: string, defaultValue: T, userAddress: string | null): T => {
    if (!userAddress) return defaultValue;
    const addressKey = `${key}_${userAddress}`;
    try {
        const storedValue = localStorage.getItem(addressKey);
        if (storedValue !== null) { // Check for null to handle boolean 'false' correctly
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error reading from localStorage for key "${addressKey}":`, error);
    }
    return defaultValue;
};

// Helper for deep merging objects, useful for settings. Saved values override defaults.
const deepMerge = <T extends object>(defaults: T, saved: Partial<T>): T => {
    const merged = { ...defaults };
    for (const key in saved) {
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
            const savedValue = saved[key as keyof T];
            const defaultValue = defaults[key as keyof T];

            if (
                typeof savedValue === 'object' && savedValue !== null && !Array.isArray(savedValue) &&
                typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
            ) {
                // It's a nested object, recurse
                merged[key as keyof T] = deepMerge(defaultValue as object, savedValue as object) as T[keyof T];
            } else if (savedValue !== undefined) {
                // It's a primitive or array, or one of them is not an object, so just overwrite
                merged[key as keyof T] = savedValue;
            }
        }
    }
    return merged;
};

const useUserSettings = (userAddress: string | null) => {
    const theme: Theme = 'dark';
    
    const [settings, setSettings] = useState<Settings>(DARK_THEME_SETTINGS);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [allSymbols, setAllSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
    const [userSymbols, setUserSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
    const [isConfluenceFilterActive, setIsConfluenceFilterActive] = useState<boolean>(false);
    const [isVisualView, setIsVisualView] = useState<boolean>(false);
    const viewMode: ViewMode = 'kiwiTrailTable';
    const [timeframe, setTimeframe] = useState<Timeframe>('4h');

    // This effect is crucial for reloading user data when the user address changes (e.g., on login).
    useEffect(() => {
        if (userAddress) {
            // Re-initialize all state from localStorage for the newly logged-in user.
            const defaultSettings = DARK_THEME_SETTINGS;
            const storedSettings = getInitialState<Partial<Settings>>('settings', {}, userAddress);
            const mergedSettings = deepMerge(defaultSettings, storedSettings);
            setSettings(mergedSettings);

            setFavorites(getInitialState<string[]>('favorites', [], userAddress));
            const savedAllSymbols = getInitialState<string[]>('allSymbols', DEFAULT_SYMBOLS, userAddress);
            setAllSymbols(savedAllSymbols);
            
            // Determine user symbols based on saved list selection or custom list
            if (mergedSettings.selectedAssetList === 'CUSTOM') {
                 setUserSymbols(getInitialState<string[]>('userSymbols', savedAllSymbols, userAddress));
            } else if (mergedSettings.selectedAssetList === 'SECONDARY') {
                setUserSymbols(SECONDARY_SYMBOLS);
            } else if (mergedSettings.selectedAssetList === 'TERTIARY') {
                setUserSymbols(TERTIARY_SYMBOLS);
            } else {
                setUserSymbols(DEFAULT_SYMBOLS);
            }
            
            setIsSubscribed(getInitialState<boolean>('isSubscribed', false, userAddress));
            setShowFavoritesOnly(getInitialState<boolean>('showFavoritesOnly', false, userAddress));
            setIsConfluenceFilterActive(getInitialState<boolean>('isConfluenceFilterActive', false, userAddress));
            setIsVisualView(getInitialState<boolean>('isVisualView', false, userAddress));
        } else {
             // This is a logout event. Reset all settings to default.
            setSettings(DARK_THEME_SETTINGS);
            setFavorites([]);
            setAllSymbols(DEFAULT_SYMBOLS);
            setUserSymbols(DEFAULT_SYMBOLS);
            setIsSubscribed(false);
            setShowFavoritesOnly(false);
            setIsConfluenceFilterActive(false);
            setIsVisualView(false);
        }
    }, [userAddress]);
    
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);
    
    useEffect(() => { if (userAddress) localStorage.setItem(`settings_${userAddress}`, JSON.stringify(settings)); }, [settings, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`favorites_${userAddress}`, JSON.stringify(favorites)); }, [favorites, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`userSymbols_${userAddress}`, JSON.stringify(userSymbols)); }, [userSymbols, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`allSymbols_${userAddress}`, JSON.stringify(allSymbols)); }, [allSymbols, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`isSubscribed_${userAddress}`, JSON.stringify(isSubscribed)); }, [isSubscribed, userAddress]);
    
    // Save UI state to localStorage
    useEffect(() => { if (userAddress) localStorage.setItem(`showFavoritesOnly_${userAddress}`, JSON.stringify(showFavoritesOnly)); }, [showFavoritesOnly, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`isConfluenceFilterActive_${userAddress}`, JSON.stringify(isConfluenceFilterActive)); }, [isConfluenceFilterActive, userAddress]);
    useEffect(() => { if (userAddress) localStorage.setItem(`isVisualView_${userAddress}`, JSON.stringify(isVisualView)); }, [isVisualView, userAddress]);
    
    const handleSettingChange = useCallback((key: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    // This effect reacts to changes in the selected list and updates the userSymbols accordingly.
    useEffect(() => {
        if (!userAddress) return; // Don't run this logic if logged out
        // This logic only applies if the user hasn't created a custom list.
        if (settings.selectedAssetList === 'CUSTOM') return;

        if (settings.selectedAssetList === 'MASTER') {
            setUserSymbols(DEFAULT_SYMBOLS);
            setAllSymbols(DEFAULT_SYMBOLS);
        } else if (settings.selectedAssetList === 'SECONDARY') {
            setUserSymbols(SECONDARY_SYMBOLS);
            setAllSymbols(SECONDARY_SYMBOLS);
        } else if (settings.selectedAssetList === 'TERTIARY') {
            setUserSymbols(TERTIARY_SYMBOLS);
            setAllSymbols(TERTIARY_SYMBOLS);
        }
    }, [settings.selectedAssetList, userAddress]);

    
    const handleAlertConditionChange = useCallback((key: keyof AlertConditions, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            alertConditions: {
                ...prev.alertConditions,
                [key]: value
            }
        }));
    }, []);

    const handleColumnVisibilityChange = useCallback((key: string, value: boolean) => {
        setSettings(prev => ({
            ...prev,
            visibleColumns: {
                ...prev.visibleColumns,
                [key]: value,
            },
        }));
    }, []);

    const toggleFavorite = useCallback((symbol: string) => {
        setFavorites(prev => 
            prev.includes(symbol) ? prev.filter(f => f !== symbol) : [...prev, symbol]
        );
    }, []);
    
    const handleShowFavoritesOnlyToggle = useCallback(() => setShowFavoritesOnly(prev => !prev), []);
    const handleToggleConfluenceFilter = useCallback(() => setIsConfluenceFilterActive(prev => !prev), []);
    const handleToggleVisualView = useCallback(() => setIsVisualView(prev => !prev), []);
    
    const handleTimeframeChange = useCallback((tf: Timeframe) => setTimeframe(tf), []);

    const handleSaveAssetList = useCallback((data: { allSymbols: string[], selectedSymbols: string[] }) => {
        setAllSymbols(data.allSymbols);
        setUserSymbols(data.selectedSymbols);
        // When user saves a custom list, we mark it as custom.
        handleSettingChange('selectedAssetList', 'CUSTOM');
    }, [handleSettingChange]);
    
    const handleResetSettings = useCallback(() => {
        if (window.confirm("This will clear ALL data for ALL connected wallets and reset the app. Are you sure?")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    }, []);

    const handleSubscribe = useCallback(() => {
        if (userAddress) {
             setIsSubscribed(true);
        }
    }, [userAddress]);
    
    return {
        settings, theme, favorites, userSymbols, allSymbols, showFavoritesOnly, isConfluenceFilterActive, isVisualView, viewMode, timeframe, isSubscribed,
        handleSettingChange,
        handleAlertConditionChange, 
        handleColumnVisibilityChange,
        toggleFavorite, handleShowFavoritesOnlyToggle, handleToggleConfluenceFilter, handleToggleVisualView,
        handleSaveAssetList, handleResetSettings, handleTimeframeChange, handleSubscribe,
    };
};

export default useUserSettings;