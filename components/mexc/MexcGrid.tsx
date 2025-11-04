import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { type Settings, type Timeframe, type MexcTableRowData, type MexcSortKey, type SortDirection } from '../../types';
import { fetchTopGainersList, fetchDetailedDataForSymbolChunk } from '../../services/mexcService';
import MexcRow from './MexcRow';
import MexcRowSkeleton from './MexcRowSkeleton';
import SortableHeader from '../kiwi/SortableHeader';

const MexcGrid: React.FC<{
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe, source: 'cex' | 'mexc') => void;
}> = ({ settings, favorites, onToggleFavorite, onKiwiTrailCellClick }) => {
    const [tableData, setTableData] = useState<MexcTableRowData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: MexcSortKey; direction: SortDirection }>({ key: 'change5m', direction: 'desc' });
    // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialLoad = useRef(true);

    const fetchData = async (signal: AbortSignal) => {
        // Only show the full skeleton screen on the very first load.
        if (isInitialLoad.current) {
            setIsLoading(true);
        }
        
        try {
            // Fetch top 30 symbols to have some buffer in case some fail to load details.
            const topSymbols = await fetchTopGainersList(30, signal);
            if (signal.aborted) return;
            
            const finalData: MexcTableRowData[] = [];
            // MEXC API rate limit is ~20 req/s. Each symbol detail fetch makes ~6 requests.
            // A chunk size of 3 keeps the burst at ~18 req/s, safely under the limit.
            const CHUNK_SIZE = 2;

            for (let i = 0; i < topSymbols.length && finalData.length < 15; i += CHUNK_SIZE) {
                if (signal.aborted) return;
                
                const chunkSymbols = topSymbols.slice(i, i + CHUNK_SIZE);
                const chunkData = await fetchDetailedDataForSymbolChunk(chunkSymbols, settings, signal);
                const validChunkData = chunkData.filter((d): d is MexcTableRowData => d !== null);

                finalData.push(...validChunkData);

                // For a better initial loading experience, we can update the view progressively.
                if (isInitialLoad.current) {
                    setTableData([...finalData]);
                }
                
                if (finalData.length >= 20) break;

                // Pause between chunks to further spread out requests over time.
                if (i + CHUNK_SIZE < topSymbols.length) {
                     await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            if (!signal.aborted) {
                // For both initial load and refreshes, set the final, complete data at the end.
                // This ensures a seamless update on refreshes without showing skeletons.
                setTableData(finalData.slice(0, 20));

                if (isInitialLoad.current) {
                    setIsLoading(false);
                    isInitialLoad.current = false;
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error("Failed to fetch MEXC top gainers:", error);
                setTableData([]);
            }
        } finally {
            if (!signal.aborted && isInitialLoad.current && isLoading) {
                setIsLoading(false);
            }
        }
    };
    
    useEffect(() => {
        const controller = new AbortController();
        
        const scheduleFetch = () => {
            fetchData(controller.signal);
            refreshTimeoutRef.current = setTimeout(scheduleFetch, 60000); // Refresh every 1 minute
        };
        
        scheduleFetch();

        return () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            controller.abort();
        };
    }, [settings]);


    const handleSort = (key: MexcSortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const sortedData = useMemo(() => {
        return [...tableData].sort((a, b) => {
            const { key, direction } = sortConfig;
            const dir = direction === 'asc' ? 1 : -1;

            if (key.startsWith('kt-')) {
                const tf = key.split('-')[1] as '1m' | '5m' | '15m';
                const flipA = a.kiwiFlips[tf] ? 1 : 0;
                const flipB = b.kiwiFlips[tf] ? 1 : 0;
                if (flipA !== flipB) return (flipB - flipA) * dir; // Flips first

                const biasA = a.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;
                const biasB = b.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;
                if (biasA !== biasB) return (biasB - biasA) * dir; // Bullish bias first
                return 0;
            }

            const valA = a[key as keyof Omit<MexcTableRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap'>];
            const valB = b[key as keyof Omit<MexcTableRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap'>];
            
            if (key === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
            if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
            
            return 0;
        });
    }, [tableData, sortConfig]);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 20 }).map((_, i) => <MexcRowSkeleton key={i} />);
        }
        if (tableData.length > 0) {
            return sortedData.map(rowData => (
                <MexcRow
                    key={rowData.symbol}
                    rowData={rowData}
                    isFavorite={favorites.includes(rowData.symbol)}
                    onToggleFavorite={onToggleFavorite}
                    onKiwiTrailCellClick={onKiwiTrailCellClick}
                    settings={settings}
                />
            ));
        }
        return (
            <tr>
                <td colSpan={10} className="text-center py-16">
                    <i className="fa-solid fa-table-list text-4xl mb-4"></i>
                    <p>No gainers found or API is unavailable.</p>
                </td>
            </tr>
        );
    };

    return (
        <div className="overflow-x-auto rounded-2xl border border-dark-border/30">
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-dark-bg sticky top-0 z-20">
                    <tr className="border-b-2 border-dark-border">
                        <th scope="col" className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-30 w-30 text-center border-r border-dark-border/50"><SortableHeader sortKey="symbol" label="Symbol" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center"/></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="price" label="Price" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="volume24h" label="Vol 24h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="change24h" label="Chg% 24h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="change5m" label="Chg% 5m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-1m" label="1m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-5m" label="5m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-15m" label="15m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center">VWAP</th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="rsi5m" label="RSI 5m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {renderContent()}
                </tbody>
            </table>
        </div>
    );
};

export default memo(MexcGrid);