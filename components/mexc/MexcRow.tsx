import React, { memo } from 'react';
import type { MexcTableRowData, Timeframe, Settings, SymbolData, MexcKiwiData, MexcKiwiFlips } from '../../types';
import FavoriteButton from '../FavoriteButton';
import { getRsiColorInfo } from '../../constants';

// Helper to format price strings
const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toPrecision(4);
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
    return <div className={`w-3 h-3 rounded-full mx-auto ${color}`}></div>;
};

const MexcRow: React.FC<{
    rowData: MexcTableRowData;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe, source: 'cex' | 'mexc') => void;
    settings: Settings;
}> = memo(({ rowData, isFavorite, onToggleFavorite, onKiwiTrailCellClick, settings }) => {
    const { symbol, price, change5m, change24h, volume24h, dailyVwap, rsi5m, kiwiData, kiwiFlips } = rowData;

    const handleCellClick = (timeframe: Timeframe) => (e: React.MouseEvent) => {
        e.stopPropagation();
        onKiwiTrailCellClick(symbol, timeframe, 'mexc');
    };

    return (
        <tr className="hover:bg-dark-card/50 cursor-pointer even:bg-dark-card/20" role="row" onClick={() => onKiwiTrailCellClick(symbol, '5m', 'mexc')}>
            <td className="relative px-2 py-2 sm:py-3 font-bold sticky left-0 bg-dark-bg/90 z-20 w-30 min-w-30 text-left transition-colors border-r border-dark-border/50">
                <div className="flex items-center gap-3">
                    <FavoriteButton symbol={symbol} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
                    <a 
                        href={`https://www.mexc.com/exchange/${symbol.replace('USDT', '_USDT')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="truncate hover:text-primary hover:underline transition-colors text-sm"
                        title={`Open ${symbol} on MEXC`}
                    >
                        {symbol}
                    </a>
                </div>
            </td>
            <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatPrice(price)}</td>
            <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatUsdValue(volume24h)}</td>
            <ColorizedCell value={change24h} formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`} />
            <ColorizedCell value={change5m} formatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`} />
            
            {(['1m', '5m', '15m'] as (keyof MexcKiwiData)[]).map(tf => (
                 <td key={tf} onClick={handleCellClick(tf as Timeframe)} className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${kiwiFlips[tf as keyof MexcKiwiFlips] && settings.enableLiveAnimations ? 'animate-pulse-glow-cell' : ''}`}>
                    <KiwiTrailDot data={kiwiData[tf]} />
                </td>
            ))}
            
            <td className="px-2 py-2 sm:py-3 text-center">
                {dailyVwap !== null && dailyVwap !== 0 ? (
                    <div title={`Daily VWAP: ${formatPrice(dailyVwap)}`}>
                        <i className={`fa-solid ${price > dailyVwap ? 'fa-arrow-up text-primary' : 'fa-arrow-down text-red-500'}`}></i>
                    </div>
                ) : (
                    <span className="text-medium-text/50">-</span>
                )}
            </td>

            <td className={`px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm ${getRsiColorInfo(rsi5m).bgColor}`}>
                {rsi5m.toFixed(1)}
            </td>
        </tr>
    );
});

export default MexcRow;