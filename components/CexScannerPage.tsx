

import React, { useState, useMemo, memo } from 'react';
import { 
    type Settings, 
    type Timeframe, 
    type KiwiTrailRowData,
    type SortKey,
    type SortDirection,
} from '../types';
import KiwiTrailTable from './kiwi/KiwiTrailTable';
import KiwiVisualizer from './visualizer/KiwiVisualizer';
import { useAppContext } from '../context/AppContext';

// === MAIN CEX SCANNER PAGE COMPONENT ===
const CexScannerPage: React.FC<{
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    isConfluenceFilterActive: boolean;
}> = ({ onKiwiTrailCellClick, settings, favorites, onToggleFavorite, isConfluenceFilterActive }) => {
    const { isVisualView, kiwiTrailData, isKiwiDataLoading, displayedSymbols } = useAppContext();
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'price', direction: 'desc' });
    
    const tableData = useMemo(() => {
        return displayedSymbols
            .map(symbol => kiwiTrailData.get(symbol))
            .filter((d): d is KiwiTrailRowData => d !== undefined);
    }, [displayedSymbols, kiwiTrailData]);

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedData = useMemo(() => {
        let filteredData = tableData;
        if (isConfluenceFilterActive) {
            filteredData = tableData.filter(row => {
                return row.oiChange4h > 0 &&
                       row.oiChange8h > 0 &&
                       row.delta15m > 0 &&
                       row.delta1h > 0 &&
                       row.dailyVwap !== null && row.price > row.dailyVwap;
            });
        }
        
        return [...filteredData].sort((a, b) => {
            const { key, direction } = sortConfig;

            const getSignalStrength = (signal: 'BUY' | 'SELL' | 'SL_HIT' | 'NONE' | undefined) => {
                switch(signal) {
                    case 'BUY': return 2;
                    case 'SELL': return 1;
                    case 'SL_HIT': return 0;
                    default: return -1;
                }
            }
            
            if (key.startsWith('kt-')) {
                const tf = key.split('-')[1] as Timeframe;
                const flipA = a.kiwiFlips[tf as keyof KiwiTrailRowData['kiwiFlips']] ? 1 : 0;
                const flipB = b.kiwiFlips[tf as keyof KiwiTrailRowData['kiwiFlips']] ? 1 : 0;

                if (flipA !== flipB) {
                    return direction === 'desc' ? flipB - flipA : flipA - flipB;
                }

                const biasA = a.kiwiData[tf as keyof KiwiTrailRowData['kiwiData']]?.kiwiTrail?.slice(-1)[0]?.bias ?? -1;
                const biasB = b.kiwiData[tf as keyof KiwiTrailRowData['kiwiData']]?.kiwiTrail?.slice(-1)[0]?.bias ?? -1;

                if (biasA !== biasB) {
                    return direction === 'desc' ? biasB - biasA : biasA - biasB;
                }
                return 0;
            }

            if (key.startsWith('hl-')) {
                const tf = key.split('-')[1] as '5m' | '15m' | '30m' | '1h';
                const signalA = getSignalStrength(a.highLowAlgo[tf]);
                const signalB = getSignalStrength(b.highLowAlgo[tf]);
                if (signalA !== signalB) {
                     return direction === 'desc' ? signalB - signalA : signalA - signalB;
                }
                return 0;
            }
            
            const dir = direction === 'asc' ? 1 : -1;
            if (key === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
            
            const valA = a[key as keyof Omit<KiwiTrailRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap' | 'highLowAlgo'>];
            const valB = b[key as keyof Omit<KiwiTrailRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap' | 'highLowAlgo'>];
            
            if(typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
            return 0;
        });
    }, [tableData, sortConfig, isConfluenceFilterActive]);

    if (isVisualView) {
        return <KiwiVisualizer data={Array.from(kiwiTrailData.values())} favorites={favorites} onSignalClick={onKiwiTrailCellClick} />;
    }

    return (
        <KiwiTrailTable
            loading={isKiwiDataLoading && tableData.length === 0}
            data={sortedData}
            symbols={displayedSymbols}
            settings={settings}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            sortConfig={sortConfig}
            onSort={handleSort}
            onKiwiTrailCellClick={onKiwiTrailCellClick}
        />
    );
};

export default memo(CexScannerPage);