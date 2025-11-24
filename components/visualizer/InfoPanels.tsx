import React from 'react';
import type { KiwiTrailRowData } from '../../types';

interface InfoPanelsProps {
    symbols: KiwiTrailRowData[];
}

const formatUsdValue = (volume: number) => {
    if (Math.abs(volume) >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}M`;
    if (Math.abs(volume) >= 1_000) return `$${(volume / 1_000).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
};

const formatPercent = (val: number) => `${val.toFixed(2)}%`;

const InfoPanels: React.FC<InfoPanelsProps> = ({ symbols }) => {
    if (symbols.length === 0) return null;

    const rightPanelSymbols = symbols.slice(0, 5);
    const bottomPanelSymbols = symbols.slice(0, 5);


    return (
        <>
            {/* Right Panel - Key Data (Top 4 Symbols) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-0 md:right-0 lg:right- w-30 md:w-40 flex flex-col gap-2 z-30">
                {rightPanelSymbols.map(s => (
                    <div key={s.symbol} className="bg-dark-bg/50 backdrop-blur-sm rounded-lg border border-dark-border/50 p-3">
                        <p className="font-bold text-base text-center text-light-text mb-2">{s.symbol.replace('USDT','')}</p>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-medium-text">OI Δ (8h)</span>
                                <span className={`font-mono ${s.oiChange8h >= 0 ? 'text-primary' : 'text-red-500'}`}>{formatPercent(s.oiChange8h)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs text-medium-text">Ticks (5m)</span>
                                <span className="font-mono text-light-text">{s.ticks5m.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Panel - Unified Data Cards (Next 4 Symbols) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex justify-center items-stretch gap-2">
                {bottomPanelSymbols.map(s => {
                    const volatility = (s.atr1h && s.price > 0) ? (s.atr1h / s.price) * 100 : 0;
                    return (
                        <div key={s.symbol} className="bg-dark-bg/50 backdrop-blur-sm rounded-lg border border-dark-border/50 p-3 w-36">
                            <p className="font-bold text-base text-center text-light-text mb-2 truncate" title={s.symbol}>{s.symbol.replace('USDT','')}</p>
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="text-xs text-medium-text whitespace-nowrap">V.Delta (1h)</span>
                                    <span className={`font-mono text-xs ${s.delta1h >= 0 ? 'text-primary' : 'text-red-500'}`}>{formatUsdValue(s.delta1h)}</span>
                                </div>
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="text-xs text-medium-text whitespace-nowrap">Volatility (1h%)</span>
                                    <span className="font-mono text-xs text-light-text">{volatility.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default InfoPanels;