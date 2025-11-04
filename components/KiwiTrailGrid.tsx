import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
    type Settings, 
    type Timeframe, 
    type KiwiTrailRowData,
    type SortKey,
    type SortDirection,
} from '../types';
import { fetchRsiForSymbol, fetchKlines, fetchDailyVwap } from '../services/binanceService';
import KiwiTrailRow from './kiwi/KiwiTrailRow';
import KiwiTrailRowSkeleton from './kiwi/KiwiTrailRowSkeleton';
import SortableHeader from './kiwi/SortableHeader';
import { TOGGLEABLE_COLUMNS } from '../constants';

// === HELPER ===
const hasRecentFlip = (trail?: { bias: number }[]): boolean => {
    if (!trail || trail.length < 2) return false;
    const len = trail.length;
    // Flip on the most recent candle
    if (trail[len - 1].bias !== trail[len - 2].bias) return true;
    // Flip on the second to last candle
    if (len >= 3 && trail[len - 2].bias !== trail[len - 3].bias) return true;
    return false;
};

// === MAIN GRID COMPONENT ===
const KiwiTrailGrid: React.FC<{
    symbols: string[];
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe, source: 'cex' | 'mexc') => void;
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    isConfluenceFilterActive: boolean;
}> = ({ symbols, onKiwiTrailCellClick, settings, favorites, onToggleFavorite, isConfluenceFilterActive }) => {
    const [tableData, setTableData] = useState<KiwiTrailRowData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'price', direction: 'desc' });
    
    // Effect for initial data load via REST API
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        
        const fetchInitialData = async () => {
            if (symbols.length === 0) {
                setTableData([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            setTableData([]); // Reset data for new fetch

            try {
                const [ticker24hRes, premiumIndexRes, btcKlines1hRes] = await Promise.all([
                    fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal }),
                    fetch('https://fapi.binance.com/fapi/v1/premiumIndex', { signal }),
                    fetchKlines('BTCUSDT', '1h', 2)
                ]);
                if (signal.aborted) return;
                
                const ticker24hData = await ticker24hRes.json();
                const premiumIndexData = await premiumIndexRes.json();
                if (signal.aborted) return;

                 if (!Array.isArray(ticker24hData)) {
                    console.error("Failed to fetch initial market data, API response was not an array.", ticker24hData);
                    setLoading(false);
                    return;
                }

                let btcChg1h = 0;
                if (btcKlines1hRes && btcKlines1hRes.length >= 2) {
                    btcChg1h = ((parseFloat(btcKlines1hRes[1][4]) - parseFloat(btcKlines1hRes[0][4])) / parseFloat(btcKlines1hRes[0][4])) * 100;
                }

                const CHUNK_SIZE = 15;
                for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
                    if (signal.aborted) return;

                    const symbolChunk = symbols.slice(i, i + CHUNK_SIZE);
                    
                    const symbolDataPromises = symbolChunk.map(async (symbol) => {
                         try {
                            const kiwi5m = await fetchRsiForSymbol(symbol + '.P', '5m', settings);
                            const kiwi15m = await fetchRsiForSymbol(symbol + '.P', '15m', settings);
                            const kiwi1h = await fetchRsiForSymbol(symbol + '.P', '1h', settings);
                            const kiwi4h = await fetchRsiForSymbol(symbol + '.P', '4h', settings);
                            const klines5m = await fetchKlines(symbol + '.P', '5m', 2);
                            const klines15m = await fetchKlines(symbol + '.P', '15m', 2);
                            const futuresKlines1h = await fetchKlines(symbol + '.P', '1h', 1);
                            const spotKlines1h = await fetchKlines(symbol, '1h', 1);
                            const dailyVwap = await fetchDailyVwap(symbol + '.P');
                            const symbolKlines1h = await fetchKlines(symbol, '1h', 2);

                            if (signal.aborted) return null;

                            const ticker = ticker24hData.find((t: any) => t.symbol === symbol);
                            const premium = premiumIndexData.find((p: any) => p.symbol === symbol);
                            
                            if (!ticker) return null;

                            const change15m = (klines15m?.[1] && klines15m?.[0]) ? ((parseFloat(klines15m[1][4]) - parseFloat(klines15m[0][4])) / parseFloat(klines15m[0][4])) * 100 : 0;
                            
                            let symbolChg1h = 0;
                            if (symbolKlines1h && symbolKlines1h.length >= 2) {
                                symbolChg1h = ((parseFloat(symbolKlines1h[1][4]) - parseFloat(symbolKlines1h[0][4])) / parseFloat(symbolKlines1h[0][4])) * 100;
                            }
                            const vsBtc1h = symbolChg1h - btcChg1h;
                            const rsi4h = kiwi4h?.rsi?.slice(-1)[0]?.value ?? 0;
                            
                            const cvd15mPoints = kiwi15m?.cvd?.slice(-24);
                            const cvd15m = (cvd15mPoints && cvd15mPoints.length > 1) ? cvd15mPoints[cvd15mPoints.length - 1].value - cvd15mPoints[0].value : 0;
                            
                            const cvd1hPoints = kiwi1h?.cvd?.slice(-24);
                            const cvd1h = (cvd1hPoints && cvd1hPoints.length > 1) ? cvd1hPoints[cvd1hPoints.length - 1].value - cvd1hPoints[0].value : 0;
                            
                            return {
                                symbol, price: parseFloat(ticker?.lastPrice) || 0, change24h: parseFloat(ticker?.priceChangePercent) || 0,
                                fundingRate: parseFloat(premium?.lastFundingRate) || 0,
                                change15m, ticks5m: klines5m?.[1] ? klines5m[1][8] : 0,
                                spotVolume1h: spotKlines1h?.[0] ? parseFloat(spotKlines1h[0][7]) : 0,
                                delta15m: klines15m?.[0] ? (2 * parseFloat(klines15m[0][10]) - parseFloat(klines15m[0][7])) : 0,
                                delta1h: futuresKlines1h?.[0] ? (2 * parseFloat(futuresKlines1h[0][10]) - parseFloat(futuresKlines1h[0][7])) : 0,
                                cvd15m, cvd1h,
                                oiChange4h: kiwi4h?.openInterestChange?.['4h'] ?? 0,
                                oiChange8h: kiwi4h?.openInterestChange?.['8h'] ?? 0,
                                dailyVwap, vsBtc1h, rsi4h,
                                kiwiData: { '5m': kiwi5m, '15m': kiwi15m, '1h': kiwi1h, '4h': kiwi4h },
                                kiwiFlips: {
                                    '5m': hasRecentFlip(kiwi5m?.luxalgoTrail), '15m': hasRecentFlip(kiwi15m?.luxalgoTrail),
                                    '1h': hasRecentFlip(kiwi1h?.luxalgoTrail), '4h': hasRecentFlip(kiwi4h?.luxalgoTrail),
                                },
                            };
                         } catch (e) {
                             console.warn(`Could not fetch all data for ${symbol}`, e);
                             return null;
                         }
                    });

                    const chunkResults = await Promise.all(symbolDataPromises);
                    setTableData(prevData => [...prevData, ...chunkResults.filter((d): d is KiwiTrailRowData => d !== null)]);

                    if (i + CHUNK_SIZE < symbols.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') console.error("Failed to fetch initial Kiwi Trail data:", error);
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        };

        fetchInitialData();
        return () => controller.abort();
    // Only refetch if symbols list changes. Settings changes are handled by the refresh effect.
    }, [symbols]);

    // Effect for WebSocket connection for streaming data
    useEffect(() => {
        if (loading || symbols.length === 0) return;

        const streams = [
            '!ticker@arr', '!markPrice@arr@1s',
            ...symbols.flatMap(s => [`${s.toLowerCase()}@kline_5m`, `${s.toLowerCase()}@kline_15m`, `${s.toLowerCase()}@kline_1h`])
        ];
        const ws = new WebSocket(`wss://fstream.binance.com/stream?streams=${streams.join('/')}`);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const { stream, data } = message;

            setTableData(prevData => {
                const dataMap = new Map(prevData.map(item => [item.symbol, item]));
                
                if (stream === '!ticker@arr') {
                    data.forEach((ticker: any) => {
                        const existing = dataMap.get(ticker.s);
                        if (existing) dataMap.set(ticker.s, Object.assign({}, existing, { price: parseFloat(ticker.c), change24h: parseFloat(ticker.P) }));
                    });
                } else if (stream === '!markPrice@arr@1s') {
                    data.forEach((markPrice: any) => {
                        const existing = dataMap.get(markPrice.s);
                        if (existing) dataMap.set(markPrice.s, Object.assign({}, existing, { fundingRate: parseFloat(markPrice.r) }));
                    });
                } else if (stream.includes('@kline_')) {
                    const symbol = data.s;
                    const kline = data.k;
                    const existing = dataMap.get(symbol);
                    if (existing) {
                        if (stream.endsWith('_5m')) {
                            dataMap.set(symbol, Object.assign({}, existing, { ticks5m: kline.n }));
                        } else if (stream.endsWith('_15m')) {
                            const quoteVolume = parseFloat(kline.q);
                            const takerBuyQuoteVolume = parseFloat(kline.Q);
                            const delta15m = 2 * takerBuyQuoteVolume - quoteVolume;
                            const change15m = parseFloat(kline.o) > 0 ? ((parseFloat(kline.c) - parseFloat(kline.o)) / parseFloat(kline.o)) * 100 : 0;
                            dataMap.set(symbol, Object.assign({}, existing, { delta15m, change15m }));
                        } else if (stream.endsWith('_1h')) {
                            const quoteVolume = parseFloat(kline.q);
                            const takerBuyQuoteVolume = parseFloat(kline.Q);
                            const delta1h = 2 * takerBuyQuoteVolume - quoteVolume;
                            dataMap.set(symbol, Object.assign({}, existing, { delta1h }));
                        }
                    }
                }
                return Array.from(dataMap.values());
            });
        };
        return () => ws.close();
    }, [loading, symbols]);

    // Effect for periodic REST refresh for calculated data (Kiwi Trail, OI, CVD, Spot Vol)
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const refreshData = async () => {
             if (loading || symbols.length === 0) return;

             const CHUNK_SIZE = 10;
             for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
                if (signal.aborted) return;
                
                const symbolChunk = symbols.slice(i, i + CHUNK_SIZE);
                
                const updatePromises = symbolChunk.map(async (symbol) => {
                    try {
                        const kiwi5m = await fetchRsiForSymbol(symbol + '.P', '5m', settings);
                        const kiwi15m = await fetchRsiForSymbol(symbol + '.P', '15m', settings);
                        const kiwi1h = await fetchRsiForSymbol(symbol + '.P', '1h', settings);
                        const kiwi4h = await fetchRsiForSymbol(symbol + '.P', '4h', settings);
                        const spotKlines1h = await fetchKlines(symbol, '1h', 1);
                        const dailyVwap = await fetchDailyVwap(symbol + '.P');
                        
                        if (signal.aborted) return null;

                        const cvd15mPoints = kiwi15m?.cvd?.slice(-24);
                        const cvd15m = (cvd15mPoints && cvd15mPoints.length > 1) ? cvd15mPoints[cvd15mPoints.length - 1].value - cvd15mPoints[0].value : 0;
                        
                        const cvd1hPoints = kiwi1h?.cvd?.slice(-24);
                        const cvd1h = (cvd1hPoints && cvd1hPoints.length > 1) ? cvd1hPoints[cvd1hPoints.length - 1].value - cvd1hPoints[0].value : 0;
                        
                        const rsi4h = kiwi4h?.rsi?.slice(-1)[0]?.value ?? 0;
                        
                        return {
                            symbol,
                            spotVolume1h: spotKlines1h?.[0] ? parseFloat(spotKlines1h[0][7]) : 0,
                            cvd15m, cvd1h,
                            oiChange4h: kiwi4h?.openInterestChange?.['4h'] ?? 0,
                            oiChange8h: kiwi4h?.openInterestChange?.['8h'] ?? 0,
                            dailyVwap,
                            rsi4h,
                            kiwiData: { '5m': kiwi5m, '15m': kiwi15m, '1h': kiwi1h, '4h': kiwi4h },
                            kiwiFlips: {
                                '5m': hasRecentFlip(kiwi5m?.luxalgoTrail), '15m': hasRecentFlip(kiwi15m?.luxalgoTrail),
                                '1h': hasRecentFlip(kiwi1h?.luxalgoTrail), '4h': hasRecentFlip(kiwi4h?.luxalgoTrail),
                            },
                        };
                    } catch (e) {
                         console.warn(`Could not refresh data for ${symbol}`, e);
                         return null;
                    }
                });
                
                const chunkUpdates = await Promise.all(updatePromises);
                
                setTableData(prevData => {
                    const dataMap = new Map(prevData.map(item => [item.symbol, item]));
                    chunkUpdates.forEach(update => {
                        if (update) {
                             const existing = dataMap.get(update.symbol);
                             if (existing) dataMap.set(update.symbol, Object.assign({}, existing, update));
                        }
                    });
                    return Array.from(dataMap.values());
                });

                if (i + CHUNK_SIZE < symbols.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
             }
        };

        const intervalId = setInterval(refreshData, 120000); // Refresh every 2 minutes

        return () => {
            clearInterval(intervalId);
            controller.abort();
        }
    // Re-run this effect if the settings object changes, as it affects the data calculation
    }, [loading, symbols, settings]);


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
            
            if (key.startsWith('kt-')) {
                const tf = key.split('-')[1] as Timeframe;
                const flipA = a.kiwiFlips[tf] ? 1 : 0;
                const flipB = b.kiwiFlips[tf] ? 1 : 0;

                if (flipA !== flipB) {
                    return direction === 'desc' ? flipB - flipA : flipA - flipB;
                }

                const biasA = a.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;
                const biasB = b.kiwiData[tf]?.luxalgoTrail?.slice(-1)[0]?.bias ?? -1;

                if (biasA !== biasB) {
                    return direction === 'desc' ? biasB - biasA : biasA - biasB;
                }
                return 0;
            }
            
            const dir = direction === 'asc' ? 1 : -1;
            if (key === 'symbol') return a.symbol.localeCompare(b.symbol) * dir;
            
            const valA = a[key as keyof Omit<KiwiTrailRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap'>];
            const valB = b[key as keyof Omit<KiwiTrailRowData, 'symbol' | 'kiwiData' | 'kiwiFlips' | 'dailyVwap'>];
            
            if(typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
            return 0;
        });
    }, [tableData, sortConfig, isConfluenceFilterActive]);

    const visibleColumns = useMemo(() => settings.visibleColumns, [settings.visibleColumns]);

    const visibleColumnCount = useMemo(() => {
        const fixedColumns = 2; // Symbol, Price
        const toggledVisible = Object.values(visibleColumns).filter(v => v).length;
        return fixedColumns + toggledVisible;
    }, [visibleColumns]);

    const renderHeader = (key: string, label: string, sortKey: SortKey) => {
        if (!visibleColumns[key]) return null;
        return (
            <th scope="col" className="px-2 py-2 sm:py-3 text-center">
                <SortableHeader sortKey={sortKey} label={label} sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center"/>
            </th>
        );
    };

    return (
        <div className="overflow-x-auto rounded-2xl border border-dark-border/30">
             <table className="min-w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-dark-bg sticky top-0 z-20">
                    <tr className="border-b-2 border-dark-border">
                        <th scope="col" className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-30 w-30 text-center border-r border-dark-border/50"><SortableHeader sortKey="symbol" label="Symbol" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center"/></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="price" label="Price" sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center" /></th>
                        {TOGGLEABLE_COLUMNS.map(({ key, label }) => {
                            if (key.startsWith('kt-')) {
                                if (!visibleColumns[key]) return null;
                                const tfLabel = key.split('-')[1];
                                return (
                                    <th scope="col" key={key} className="px-2 py-2 sm:py-3 text-center">
                                        <SortableHeader sortKey={key as SortKey} label={tfLabel} sortConfig={sortConfig} onSort={handleSort} className="w-full justify-center"/>
                                    </th>
                                );
                            }
                            if (key === 'dailyVwap') {
                                if (!visibleColumns[key]) return null;
                                return <th key={key} scope="col" className="px-2 py-2 sm:py-3 text-center">{label}</th>;
                            }
                            return renderHeader(key, label, key as SortKey);
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {loading && sortedData.length === 0 ? (
                        Array.from({ length: Math.min(symbols.length, 20) || 15 }).map((_, i) => <KiwiTrailRowSkeleton key={i} visibleColumns={visibleColumns} />)
                    ) : (
                        sortedData.map(rowData => (
                            <KiwiTrailRow
                                key={rowData.symbol}
                                rowData={rowData}
                                onKiwiTrailCellClick={(symbol, timeframe) => onKiwiTrailCellClick(symbol, timeframe, 'cex')}
                                isFavorite={favorites.includes(rowData.symbol)}
                                onToggleFavorite={onToggleFavorite}
                                settings={settings}
                                visibleColumns={visibleColumns}
                            />
                        ))
                    )}
                    {!loading && sortedData.length === 0 && (
                        <tr>
                            <td colSpan={visibleColumnCount} className="text-center py-16">
                                <i className="fa-solid fa-table-list text-4xl mb-4"></i>
                                <p>No symbols to display.</p>
                                <p className="text-sm">Please add symbols to your Asset List in the settings.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default memo(KiwiTrailGrid);