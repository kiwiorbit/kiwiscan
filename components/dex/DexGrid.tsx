import React, { useState, useEffect, useMemo, memo } from 'react';
import { type Settings, type Timeframe, type DexTableRowData, type DexSortKey, type SortDirection } from '../../types';
import { fetchDexTokenDataForTable } from '../../services/coingeckoService';
import DexRow from './DexRow';
import DexRowSkeleton from './DexRowSkeleton';
import SortableHeader from '../kiwi/SortableHeader'; // Re-using the CEX sortable header

const DexGrid: React.FC<{
    contracts: string[];
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
}> = ({ contracts, settings, favorites, onToggleFavorite, onKiwiTrailCellClick }) => {
    const [tableData, setTableData] = useState<DexTableRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: DexSortKey; direction: SortDirection }>({ key: 'volume24h', direction: 'desc' });

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchAllData = async () => {
            if (contracts.length === 0) {
                setTableData([]);
                setLoading(false);
                return;
            }
            setLoading(true);

            const promises = contracts.map(address => fetchDexTokenDataForTable(address, settings));
            const results = await Promise.all(promises);

            if (signal.aborted) return;
            
            setTableData(results.filter((d): d is DexTableRowData => d !== null));
            setLoading(false);
        };
        
        fetchAllData();
        const intervalId = setInterval(fetchAllData, 120000); // Refresh every 2 minutes

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [contracts, settings]);

    const handleSort = (key: DexSortKey) => {
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
                const tf = key.split('-')[1] as '5m' | '15m' | '1h' | '4h';
                const flipA = a.kiwiFlips[tf] ? 1 : 0;
                const flipB = b.kiwiFlips[tf] ? 1 : 0;
                if (flipA !== flipB) return (flipB - flipA) * dir; // Flips first

                const biasA = a.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;
                const biasB = b.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;
                if (biasA !== biasB) return (biasB - biasA) * dir; // Bullish bias first
                return 0;
            }

            const valA = a[key as keyof Omit<DexTableRowData, 'address' | 'name' | 'kiwiData' | 'kiwiFlips'>];
            const valB = b[key as keyof Omit<DexTableRowData, 'address' | 'name' | 'kiwiData' | 'kiwiFlips'>];
            
            if (key === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
            if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
            
            return 0;
        });
    }, [tableData, sortConfig]);

    return (
        <div className="overflow-x-auto rounded-2xl border border-dark-border/30">
            <p className="p-2 text-center text-xs text-medium-text bg-dark-bg">
                DEX Data Powered by <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">CoinGecko API</a>
            </p>
            <table className="min-w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-dark-bg sticky top-0 z-20">
                    <tr className="border-b-2 border-dark-border">
                        {/* FIX: Removed `as any` casts now that SortableHeader is generic and supports DexSortKey. */}
                        <th scope="col" className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-30 w-30 text-center border-r border-dark-border/50"><SortableHeader sortKey="symbol" label="Symbol" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center"/></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="price" label="Price" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="change24h" label="Chg% 24h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="change15m" label="Chg% 15m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="volume24h" label="Vol 24h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-5m" label="5m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-15m" label="15m" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-1h" label="1h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="kt-4h" label="4h" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {loading ? (
                        Array.from({ length: contracts.length || 5 }).map((_, i) => <DexRowSkeleton key={i} />)
                    ) : (
                        sortedData.map(rowData => (
                            <DexRow
                                key={rowData.address}
                                rowData={rowData}
                                isFavorite={favorites.includes(rowData.address)}
                                onToggleFavorite={onToggleFavorite}
                                onKiwiTrailCellClick={onKiwiTrailCellClick}
                                settings={settings}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default memo(DexGrid);