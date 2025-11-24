import React, { memo } from 'react';
import type { SymbolData, Timeframe } from '../types';
import FavoriteButton from './FavoriteButton';

interface KiwiTrailGridCellProps {
    symbol: string;
    mainData?: SymbolData;
    kiwiData?: {
        '5m'?: SymbolData;
        '15m'?: SymbolData;
        '1h'?: SymbolData;
        '4h'?: SymbolData;
    };
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
    isFavorite: boolean;
    onToggleFavorite: (symbol: string) => void;
}

const KiwiTrailDot: React.FC<{
    data?: SymbolData;
    timeframe: Timeframe;
    symbol: string;
    onClick: (symbol: string, timeframe: Timeframe) => void;
}> = ({ data, timeframe, symbol, onClick }) => {
    // FIX: Property 'luxalgoTrail' does not exist on type 'SymbolData'. Replaced with 'kiwiTrail'.
    const bias = data?.kiwiTrail?.[data.kiwiTrail.length - 1]?.bias;
    const color = bias === 1 ? 'bg-green-500' : bias === 0 ? 'bg-red-500' : 'bg-dark-border';
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(symbol, timeframe);
    };

    return (
        <button
            onClick={handleClick}
            className={`w-5 h-5 rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary ${color}`}
            aria-label={`Open ${symbol} ${timeframe} chart`}
        ></button>
    );
};

const KiwiTrailGridCell: React.FC<KiwiTrailGridCellProps> = ({
    symbol,
    mainData,
    kiwiData,
    onKiwiTrailCellClick,
    isFavorite,
    onToggleFavorite
}) => {
    const price = mainData?.price;

    return (
        <div
            className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg bg-dark-card/50 hover:bg-dark-border/50 transition-colors cursor-pointer"
            onClick={() => onKiwiTrailCellClick(symbol, '5m')}
            role="row"
            aria-label={`View details for ${symbol}`}
        >
            <div className="col-span-4 md:col-span-6 flex items-center gap-4">
                <FavoriteButton
                    symbol={symbol}
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                />
                <p className="font-bold text-light-text truncate">{symbol}</p>
            </div>
            <div className="col-span-2 md:col-span-1 text-right">
                <p className="font-mono text-sm text-medium-text">
                    {price !== undefined ? `$${price.toPrecision(4)}` : '...'}
                </p>
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
                <KiwiTrailDot data={kiwiData?.['5m']} timeframe="5m" symbol={symbol} onClick={onKiwiTrailCellClick} />
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
                <KiwiTrailDot data={kiwiData?.['15m']} timeframe="15m" symbol={symbol} onClick={onKiwiTrailCellClick} />
            </div>
            <div className="col-span-1 flex justify-center">
                <KiwiTrailDot data={kiwiData?.['1h']} timeframe="1h" symbol={symbol} onClick={onKiwiTrailCellClick} />
            </div>
            <div className="col-span-1 flex justify-center">
                <KiwiTrailDot data={kiwiData?.['4h']} timeframe="4h" symbol={symbol} onClick={onKiwiTrailCellClick} />
            </div>
        </div>
    );
};

export default memo(KiwiTrailGridCell);