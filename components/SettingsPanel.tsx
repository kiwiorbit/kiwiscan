

import React from 'react';
import type { Settings, TrailingStopSettings } from '../types';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAssetModal: () => void;
    onOpenAlertsModal: () => void;
    onOpenAlertLogModal: () => void;
    onOpenTableSettingsModal: () => void;
    onOpenAutomationModal: () => void;
    onReset: () => void;
    settings: Settings;
    onSettingChange: (key: keyof Settings, value: any) => void;
    userAddress: string | null;
    disconnectWallet: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    onOpenAssetModal,
    onOpenAlertsModal,
    onOpenAlertLogModal,
    onOpenTableSettingsModal,
    onOpenAutomationModal,
    onReset,
    settings,
    onSettingChange,
    userAddress,
    disconnectWallet,
}) => {
    
    if (!isOpen) {
        return null;
    }

    const handleResetClick = () => {
        if (window.confirm("Are you sure you want to clear all data? This will reset all favorites, custom assets, and settings to their defaults. The application will then refresh.")) {
            onReset();
        }
    };

    const handleKiwiSettingChange = (key: keyof TrailingStopSettings, value: any) => {
        onSettingChange('trailingStopSettings', {
            ...settings.trailingStopSettings,
            [key]: value
        });
    };
    
    const truncatedAddress = userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Connected';

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300" onClick={onClose}></div>
            <div
                className={`fixed top-0 right-0 h-full bg-dark-bg/95 backdrop-blur-lg border-l border-dark-border/50 text-light-text shadow-2xl z-50 w-80 max-w-[90vw] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-dark-border">
                    <h3 className="text-xl font-bold">Settings</h3>
                    <button onClick={onClose} className="text-xl text-medium-text hover:text-light-text transition-colors" aria-label="Close settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                {/* Main Content (menu) */}
                <div className="flex-grow p-3 space-y-4 overflow-y-auto">
                    {/* Account Section */}
                    {userAddress && (
                        <div>
                            <h4 className="px-2 pb-1 font-semibold text-medium-text uppercase tracking-wider text-xs">Account</h4>
                            <div className="p-2.5 rounded-lg bg-dark-card/80 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-wallet text-primary"></i>
                                    <div>
                                        <p className="font-mono text-sm text-light-text" title={userAddress}>{truncatedAddress}</p>
                                        <p className="text-xs text-medium-text">Connected</p>
                                    </div>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="w-full p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Data Source Section */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text uppercase tracking-wider text-xs">Data Source</h4>
                        <div className="p-2.5 rounded-lg bg-dark-card/80 flex flex-col gap-2">
                            <label className="font-medium text-sm text-light-text">Asset List</label>
                            <div className="flex bg-dark-bg p-1 rounded-md">
                                <button
                                    onClick={() => onSettingChange('selectedAssetList', 'MASTER')}
                                    className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${settings.selectedAssetList === 'MASTER' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}
                                >
                                    ML1
                                </button>
                                <button
                                    onClick={() => onSettingChange('selectedAssetList', 'SECONDARY')}
                                    className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${settings.selectedAssetList === 'SECONDARY' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}
                                >
                                    CL2
                                </button>
                                <button
                                    onClick={() => onSettingChange('selectedAssetList', 'TERTIARY')}
                                    className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${settings.selectedAssetList === 'TERTIARY' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}
                                >
                                    CL3
                                </button>
                            </div>
                            {settings.selectedAssetList === 'CUSTOM' && (
                                <p className="text-xs text-yellow-400/80 px-1 pt-1 text-center">
                                    Using a custom asset list. Select a preset to override.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Kiwi Trail Settings */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text uppercase tracking-wider text-xs">Kiwi Trail Settings</h4>
                        <div className="p-2.5 rounded-lg bg-dark-card/80 flex flex-col gap-3">
                            <div>
                                <label className="font-medium text-sm text-light-text">Strategy (DL)</label>
                                <div className="flex bg-dark-bg p-1 rounded-md mt-1">
                                    <button onClick={() => handleKiwiSettingChange('dataLength', 1)} className={`flex-1 py-1 text-xs font-bold rounded ${settings.trailingStopSettings.dataLength === 1 ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>1</button>
                                    <button onClick={() => handleKiwiSettingChange('dataLength', 5)} className={`flex-1 py-1 text-xs font-bold rounded ${settings.trailingStopSettings.dataLength === 5 ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>5</button>
                                </div>
                            </div>
                             <div>
                                <label className="font-medium text-sm text-light-text">Lookback (DTL)</label>
                                <div className="flex bg-dark-bg p-1 rounded-md mt-1">
                                    <button onClick={() => handleKiwiSettingChange('distributionLength', 10)} className={`flex-1 py-1 text-xs font-bold rounded ${settings.trailingStopSettings.distributionLength === 10 ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>10</button>
                                    <button onClick={() => handleKiwiSettingChange('distributionLength', 100)} className={`flex-1 py-1 text-xs font-bold rounded ${settings.trailingStopSettings.distributionLength === 100 ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>100</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-dark-border/50">
                                <label htmlFor="heikin-ashi-toggle" className="font-medium text-sm pr-4 text-light-text flex-grow cursor-pointer">
                                    Use Heikin Ashi Smoothing
                                    <p className="text-xs text-medium-text/80 font-normal">Reduces noise for the trail calculation.</p>
                                </label>
                                <div className="relative">
                                    <input type="checkbox" id="heikin-ashi-toggle" className="sr-only peer" 
                                        checked={settings.trailingStopSettings.useHeikinAshiForTrail} 
                                        onChange={(e) => handleKiwiSettingChange('useHeikinAshiForTrail', e.target.checked)} 
                                    />
                                    <div className="w-10 h-5 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Options Section */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text uppercase tracking-wider text-xs">View Options</h4>
                        <div className="p-2.5 rounded-lg bg-dark-card/80 flex flex-col gap-3">
                            <div>
                                <label className="font-medium text-sm text-light-text">Chart View</label>
                                <div className="flex bg-dark-bg p-1 rounded-md mt-1">
                                    <button onClick={() => onSettingChange('chartViewMode', 'modal')} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${settings.chartViewMode === 'modal' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>Line</button>
                                    <button onClick={() => onSettingChange('chartViewMode', 'page')} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${settings.chartViewMode === 'page' ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'}`}>Candles</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="font-medium text-sm pr-4 text-light-text flex-grow">Live Animations</label>
                                <div className="relative">
                                    <input type="checkbox" id="live-animations-toggle" className="sr-only peer" checked={settings.enableLiveAnimations} onChange={(e) => onSettingChange('enableLiveAnimations', e.target.checked)} />
                                    <div className="w-10 h-5 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Customization & Alerts */}
                    <div>
                        <h4 className="px-2 pb-1 font-semibold text-medium-text uppercase tracking-wider text-xs">Management</h4>
                        <ul className="space-y-1">
                            <li><button onClick={() => { onOpenAssetModal(); onClose(); }} className="w-full text-left p-2.5 rounded-lg bg-dark-card/80 hover:bg-dark-border transition-colors flex items-center gap-3"><i className="fa-solid fa-list-check w-5 text-center text-base text-primary"></i><span className="font-medium text-sm">Edit Asset List</span></button></li>
                            <li><button onClick={() => { onOpenTableSettingsModal(); onClose(); }} className="w-full text-left p-2.5 rounded-lg bg-dark-card/80 hover:bg-dark-border transition-colors flex items-center gap-3"><i className="fa-solid fa-table-columns w-5 text-center text-base text-primary"></i><span className="font-medium text-sm">Table Columns</span></button></li>
                            <li><button onClick={() => { onOpenAlertsModal(); onClose(); }} className="w-full text-left p-2.5 rounded-lg bg-dark-card/80 hover:bg-dark-border transition-colors flex items-center gap-3"><i className="fa-solid fa-bell w-5 text-center text-base text-primary"></i><span className="font-medium text-sm">Configure Alerts</span></button></li>
                            <li><button onClick={() => { onOpenAlertLogModal(); onClose(); }} className="w-full text-left p-2.5 rounded-lg bg-dark-card/80 hover:bg-dark-border transition-colors flex items-center gap-3"><i className="fa-solid fa-clipboard-list w-5 text-center text-base text-primary"></i><span className="font-medium text-sm">View Alert Log</span></button></li>
                            <li><button onClick={() => { onOpenAutomationModal(); onClose(); }} className="w-full text-left p-2.5 rounded-lg bg-dark-card/80 hover:bg-dark-border transition-colors flex items-center gap-3"><i className="fa-solid fa-robot w-5 text-center text-base text-primary"></i><span className="font-medium text-sm">Automation / Webhooks</span></button></li>
                        </ul>
                    </div>
                </div>

                {/* Footer (Reset button) */}
                <div className="p-3 mt-auto border-t border-dark-border">
                    <button onClick={handleResetClick} className="w-full p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center gap-3">
                         <i className="fa-solid fa-broom w-5 text-center text-base"></i>
                         <span className="font-medium text-sm">Reset App</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;