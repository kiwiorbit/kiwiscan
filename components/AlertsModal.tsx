import React from 'react';
import type { Settings, AlertConditions } from '../types';

interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onAlertConditionChange: (key: keyof AlertConditions, value: boolean) => void;
}

const AlertToggle: React.FC<{
    condition: keyof AlertConditions;
    label: string;
    description: string;
    settings: Settings;
    onChange: (key: keyof AlertConditions, value: boolean) => void;
    disabled?: boolean;
}> = ({ condition, label, description, settings, onChange, disabled = false }) => {
    const isEnabled = settings.alertConditions[condition];
    const id = `modal-alert-toggle-${condition}`;
    return (
        <li>
            <div className={`p-3 rounded-lg bg-dark-bg/80 flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
                <label htmlFor={id} className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} pr-4 text-light-text flex-grow`}>
                    <span className="font-semibold">{label}</span>
                    <p className="text-xs text-medium-text">{description}</p>
                </label>
                <div className="relative">
                    <input
                        type="checkbox"
                        id={id}
                        className="sr-only peer"
                        checked={!!isEnabled}
                        onChange={(e) => onChange(condition, e.target.checked)}
                        disabled={disabled}
                    />
                    <div className="w-11 h-6 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
            </div>
        </li>
    );
};


const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose, settings, onAlertConditionChange }) => {
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-dark-bg/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg h-auto max-h-[90vh] flex flex-col border border-dark-border/50">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-light-text">Configure Alerts</h2>
                    <button onClick={onClose} className="text-2xl text-medium-text hover:text-light-text transition-colors" aria-label="Close alert settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-4 overflow-y-auto space-y-6">
                    <div>
                        <h4 className="text-lg font-bold mb-3 text-light-text">Kiwi Trail Alerts</h4>
                        <ul className="space-y-2">
                            <AlertToggle condition="kiwiBullishFlip" label="Kiwi Trail Buys" description="Alerts when the bias flips to Bullish. (15m, 1h, 4h, 1d)" settings={settings} onChange={onAlertConditionChange} />
                            <AlertToggle condition="kiwiBearishFlip" label="Kiwi Trail Sells" description="Alerts when the bias flips to Bearish. (15m, 1h, 4h, 1d)" settings={settings} onChange={onAlertConditionChange} />
                        </ul>
                    </div>
                    
                     <div className="pt-4 border-t border-dark-border">
                        <h4 className="text-lg font-bold mb-3 text-light-text">Supertrend Alerts</h4>
                        <ul className="space-y-2">
                            <AlertToggle condition="supertrendBuy" label="Supertrend Buy Signal" description="Trend flips to bullish. (4h, 1d)" settings={settings} onChange={onAlertConditionChange} />
                            <AlertToggle condition="supertrendSell" label="Supertrend Sell Signal" description="Trend flips to bearish. (4h, 1d)" settings={settings} onChange={onAlertConditionChange} />
                        </ul>
                    </div>
                </div>
                
                 {/* Footer */}
                <div className="flex justify-end p-4 border-t border-dark-border">
                    <button onClick={onClose} className="px-6 py-2 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertsModal;