import React, { memo } from 'react';
import type { KiwiTrailRowData, Timeframe, Settings, SymbolData } from '../../types';
import { KIWI_TIMEFRAMES } from '../../types';
import FavoriteButton from '../FavoriteButton';
import { getRsiColorInfo } from '../../constants';

// Helper to format price strings
const formatPrice = (price: number): string => {
    if (price >= 1000) {
        return price.toFixed(2);
    }
    if (price >= 1) {
        return price.toFixed(4);
    }
    return price.toPrecision(4);
};

const KiwiTrailRow: React.FC<{
    rowData: KiwiTrailRowData;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
    settings: Settings;
    visibleColumns: { [key: string]: boolean };
}> = memo(({ rowData, isFavorite, onToggleFavorite, onKiwiTrailCellClick, settings, visibleColumns }) => {
    const { symbol, price, change24h, change15m, ticks5m, spotVolume1h, delta15m, cvd15m, delta1h, cvd1h, oiChange4h, oiChange8h, fundingRate, kiwiData, kiwiFlips, dailyVwap, vsBtc1h, rsi4h } = rowData;

    const isConfluence = change24h > 0 && oiChange4h > 0 && delta1h > 0;

    const formatPercent = (val: number) => {
        const sign = val > 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}%`;
    };
    
    const formatUsdValue = (volume: number) => {
        if (Math.abs(volume) >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
        if (Math.abs(volume) >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
        return `$${volume.toFixed(0)}`;
    };

    const ColorizedCell: React.FC<{ value: number, formatter: (val: number) => string, className?: string }> = ({ value, formatter, className = '' }) => (
        <td className={`px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm ${value >= 0 ? 'text-primary' : 'text-red-500'} ${className}`}>{formatter(value)}</td>
    );

    const KiwiTrailDot: React.FC<{ data?: SymbolData; }> = ({ data }) => {
        const bias = data?.luxalgoTrail?.slice(-1)[0]?.bias;
        const color = bias === 1 ? 'bg-primary' : bias === 0 ? 'bg-red-500' : 'bg-dark-border';
        return (
            <div className={`w-3 h-3 rounded-full mx-auto ${color}`}></div>
        );
    };

    return (
        <tr className="hover:bg-dark-card/50 cursor-pointer even:bg-dark-card/20" role="row" onClick={() => onKiwiTrailCellClick(symbol, '15m')}>
            <td className={`relative px-2 py-2 sm:py-3 font-bold sticky left-0 bg-dark-bg/90 z-20 w-30 min-w-30 text-left transition-colors border-r border-dark-border/50`}>
                {isConfluence && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                 <div className="flex items-center gap-3">
                    <FavoriteButton symbol={symbol} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
                    <a 
                        href={`https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="truncate hover:text-primary hover:underline transition-colors text-sm"
                        title={`Open ${symbol} on TradingView`}
                    >
                        {symbol}
                    </a>
                </div>
            </td>
            <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatPrice(price)}</td>
            {visibleColumns['change24h'] && <ColorizedCell value={change24h} formatter={formatPercent} />}
            {visibleColumns['change15m'] && <ColorizedCell value={change15m} formatter={formatPercent} />}

            {visibleColumns['kt-5m'] && (
                 <td onClick={(e) => { e.stopPropagation(); onKiwiTrailCellClick(symbol, '5m'); }} className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${kiwiFlips['5m'] && settings.enableLiveAnimations ? 'animate-pulse-glow-cell' : ''}`}>
                    <KiwiTrailDot data={kiwiData['5m']} />
                </td>
            )}
             {visibleColumns['kt-15m'] && (
                 <td onClick={(e) => { e.stopPropagation(); onKiwiTrailCellClick(symbol, '15m'); }} className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${kiwiFlips['15m'] && settings.enableLiveAnimations ? 'animate-pulse-glow-cell' : ''}`}>
                    <KiwiTrailDot data={kiwiData['15m']} />
                </td>
            )}
             {visibleColumns['kt-1h'] && (
                 <td onClick={(e) => { e.stopPropagation(); onKiwiTrailCellClick(symbol, '1h'); }} className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${kiwiFlips['1h'] && settings.enableLiveAnimations ? 'animate-pulse-glow-cell' : ''}`}>
                    <KiwiTrailDot data={kiwiData['1h']} />
                </td>
            )}
            {visibleColumns['kt-4h'] && (
                 <td onClick={(e) => { e.stopPropagation(); onKiwiTrailCellClick(symbol, '4h'); }} className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${kiwiFlips['4h'] && settings.enableLiveAnimations ? 'animate-pulse-glow-cell' : ''}`}>
                    <KiwiTrailDot data={kiwiData['4h']} />
                </td>
            )}
            
            {visibleColumns['dailyVwap'] && (
                <td className="px-2 py-2 sm:py-3 text-center">
                    {dailyVwap !== null && dailyVwap !== 0 ? (
                        <div title={`Daily VWAP: ${formatPrice(dailyVwap)}`}>
                            <i className={`fa-solid ${price > dailyVwap ? 'fa-arrow-up text-primary' : 'fa-arrow-down text-red-500'}`}></i>
                        </div>
                    ) : (
                        <span className="text-medium-text/50">-</span>
                    )}
                </td>
            )}

            {visibleColumns['ticks5m'] && <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{ticks5m}</td>}
            {visibleColumns['spotVolume1h'] && <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatUsdValue(spotVolume1h)}</td>}
            {visibleColumns['delta15m'] && <ColorizedCell value={delta15m} formatter={(v) => formatUsdValue(v)} />}
            {visibleColumns['delta1h'] && <ColorizedCell value={delta1h} formatter={(v) => formatUsdValue(v)} />}
            {visibleColumns['cvd15m'] && <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatUsdValue(cvd15m)}</td>}
            {visibleColumns['cvd1h'] && <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatUsdValue(cvd1h)}</td>}
            {visibleColumns['oiChange4h'] && <ColorizedCell value={oiChange4h} formatter={formatPercent} />}
            {visibleColumns['oiChange8h'] && <ColorizedCell value={oiChange8h} formatter={formatPercent} />}
            {visibleColumns['fundingRate'] && (
                <td className="px-2 py-2 sm:py-3 text-center">
                    <div className={`w-2.5 h-2.5 rounded-full mx-auto ${fundingRate >= 0 ? 'bg-primary' : 'bg-red-500'}`} title={`Funding Rate: ${fundingRate}`}></div>
                </td>
            )}
            {visibleColumns['vsBtc1h'] && <ColorizedCell value={vsBtc1h} formatter={formatPercent} />}
            {visibleColumns['rsi4h'] && (
                <td className={`px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm ${getRsiColorInfo(rsi4h).bgColor}`}>
                    {rsi4h.toFixed(1)}
                </td>
            )}
        </tr>
    );
});

export default KiwiTrailRow;