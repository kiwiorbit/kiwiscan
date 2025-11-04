import React, { memo } from 'react';
import type { DexTableRowData, Timeframe, Settings, SymbolData, DexTimeframe } from '../../types';
import FavoriteButton from '../FavoriteButton';

const formatPrice = (price: number): string => {
    if (price >= 1) return price.toFixed(4);
    return price.toPrecision(4);
};

const formatUsdValue = (volume: number) => {
    if (Math.abs(volume) >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
    if (Math.abs(volume) >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
    return `$${volume.toFixed(0)}`;
};

const ColorizedCell: React.FC<{ value: number }> = ({ value }) => (
    <td className={`px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm ${value >= 0 ? 'text-primary' : 'text-red-500'}`}>
        {`${value > 0 ? '+' : ''}${value.toFixed(2)}%`}
    </td>
);

const KiwiTrailDotCell: React.FC<{
    data?: SymbolData;
    isFlipping: boolean;
    symbol: string;
    timeframe: DexTimeframe;
    onClick: (symbol: string, timeframe: Timeframe) => void;
    enableAnimations: boolean;
}> = ({ data, isFlipping, symbol, timeframe, onClick, enableAnimations }) => {
    const bias = data?.luxalgoTrail?.slice(-1)[0]?.bias;
    const color = bias === 1 ? 'bg-primary' : bias === 0 ? 'bg-red-500' : 'bg-dark-border';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(symbol, timeframe);
    };

    return (
        <td
            onClick={handleClick}
            className={`px-2 py-2 sm:py-3 text-center transition-colors duration-500 ${isFlipping && enableAnimations ? 'animate-pulse-glow-cell' : ''}`}
        >
            <div className={`w-3 h-3 rounded-full mx-auto ${color}`} />
        </td>
    );
};

const DexRow: React.FC<{
    rowData: DexTableRowData;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
    settings: Settings;
}> = memo(({ rowData, isFavorite, onToggleFavorite, onKiwiTrailCellClick, settings }) => {
    const { address, name, symbol, price, change24h, change15m, volume24h, kiwiData, kiwiFlips } = rowData;

    return (
        <tr className="hover:bg-dark-card/50 cursor-pointer even:bg-dark-card/20" role="row" onClick={() => onKiwiTrailCellClick(address, '15m')}>
            <td className="px-2 py-2 sm:py-3 font-bold sticky left-0 bg-dark-bg/90 z-20 w-30 min-w-30 text-left border-r border-dark-border/50">
                <div className="flex items-center gap-3">
                    <FavoriteButton symbol={address} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
                    <div className="flex-grow truncate">
                        <p className="text-sm font-bold text-light-text truncate" title={address}>{symbol}</p>
                        <p className="text-xs text-medium-text truncate">{name}</p>
                    </div>
                     <div className="flex items-center gap-3 pr-2 flex-shrink-0">
                        <a href={`https://dexscreener.com/base/${address}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="View on DexScreener" className="text-medium-text hover:text-primary transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M3.5 18.5v-13h17v13h-17ZM3.5 4.5l8.5 6 8.5-6v-1h-17v1Z" fill="currentColor"></path></svg>
                        </a>
                        <a href={`https://basescan.org/token/${address}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="View on BaseScan" className="text-medium-text hover:text-primary transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path fillRule="evenodd" clipRule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM9.25621 3.55167L4.99997 7.0394V8.49079L9.25621 12.4483L11.5238 11.0991L7.5401 8.49079V7.0394L11.5238 4.90089L9.25621 3.55167Z"></path></svg>
                        </a>
                    </div>
                </div>
            </td>
            <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatPrice(price)}</td>
            <ColorizedCell value={change24h} />
            <ColorizedCell value={change15m} />
            <td className="px-2 py-2 sm:py-3 text-center font-mono text-xs sm:text-sm">{formatUsdValue(volume24h)}</td>

            {(['5m', '15m', '1h', '4h'] as DexTimeframe[]).map(tf => (
                <KiwiTrailDotCell
                    key={tf}
                    data={kiwiData[tf]}
                    isFlipping={kiwiFlips[tf]}
                    symbol={address}
                    timeframe={tf}
                    onClick={onKiwiTrailCellClick}
                    enableAnimations={settings.enableLiveAnimations}
                />
            ))}
        </tr>
    );
});

export default DexRow;
