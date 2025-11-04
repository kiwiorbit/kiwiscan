// import type { PriceDataPoint, SymbolData, Settings, Timeframe, DexTimeframe, DexTableRowData } from '../types';
// import { calculateStatisticalTrailingStop } from './luxalgoService';
// import { calculateSupertrend } from './supertrendService';
// import { calculateVolumeProfile } from './volumeProfileService';
// import { DEX_KIWI_TIMEFRAMES } from '../types';

// const API_BASE_URL = 'https://api.coingecko.com/api/v3';
// const API_KEY = 'CG-y6Xzv2H8VD1UkPgm7agFS6ms'; // Demo key from prompt

// const hasRecentFlip = (trail?: { bias: number }[]): boolean => {
//     if (!trail || trail.length < 2) return false;
//     const len = trail.length;
//     if (trail[len - 1].bias !== trail[len - 2].bias) return true;
//     if (len >= 3 && trail[len - 2].bias !== trail[len - 3].bias) return true;
//     return false;
// };

// const mapOhlcvToPriceDataPoints = (ohlcv: [number, number, number, number, number, number][]): PriceDataPoint[] => {
//     return ohlcv.map(d => ({
//         time: d[0], // Already in milliseconds from CoinGecko
//         open: d[1],
//         high: d[2],
//         low: d[3],
//         close: d[4],
//         volume: d[5],
//         quoteVolume: 0, // Not available from this endpoint
//         takerBuyVolume: 0,
//         takerBuyQuoteVolume: 0,
//     }));
// };

// const fetchWithTimeout = async (url: string, timeout = 8000) => {
//     const controller = new AbortController();
//     const id = setTimeout(() => controller.abort(), timeout);
//     const response = await fetch(url, { signal: controller.signal });
//     clearTimeout(id);
//     return response;
// };

// const fetchDexTokenOhlcv = async (address: string, interval: DexTimeframe): Promise<PriceDataPoint[] | null> => {
//     // The interval (e.g., '5m', '1h') is directly used in the URL path as per CoinGecko documentation.
//     const url = `${API_BASE_URL}/onchain/networks/base/tokens/${address}/ohlcv/${interval}?x_cg_demo_api_key=${API_KEY}`;
    
//     try {
//         const response = await fetchWithTimeout(url);
//         if (!response.ok) {
//             console.warn(`Failed to fetch OHLCV for ${address} (${interval}): ${response.statusText}`);
//             return null;
//         }
//         const data = await response.json();
//         const ohlcv = data?.data?.attributes?.ohlcv_list;
//         if (!ohlcv || !Array.isArray(ohlcv)) return null;

//         return mapOhlcvToPriceDataPoints(ohlcv);

//     } catch (error) {
//         console.error(`Error fetching OHLCV for ${address} (${interval}):`, error);
//         return null;
//     }
// };

// const fetchDexTokenDetails = async (address: string) => {
//     const url = `${API_BASE_URL}/onchain/networks/base/tokens/${address}?x_cg_demo_api_key=${API_KEY}`;
//      try {
//         const response = await fetchWithTimeout(url);
//         if (!response.ok) {
//             console.warn(`Failed to fetch details for ${address}: ${response.statusText}`);
//             return null;
//         }
//         const data = await response.json();
//         return data?.data?.attributes;
//     } catch (error) {
//         console.error(`Error fetching details for ${address}:`, error);
//         return null;
//     }
// }

// export const fetchDexSymbolData = async (address: string, timeframe: Timeframe, settings: Settings): Promise<SymbolData> => {
//     const { candlesDisplayed } = settings;
//     const klines = await fetchDexTokenOhlcv(address, timeframe as DexTimeframe);

//     if (!klines || klines.length === 0) {
//         return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
//     }

//     const price = klines.length > 0 ? klines[klines.length - 1].close : 0;
//     const volume = klines.length > 0 ? klines[klines.length - 1].volume : 0;

//     const luxalgoTrailData = calculateStatisticalTrailingStop(klines, settings);
//     const supertrendData = calculateSupertrend(klines, 10, 1.0);
//     const volumeProfile = calculateVolumeProfile(klines.slice(-candlesDisplayed));

//     return {
//         rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], vwap: [],
//         price, volume, quoteVolume: 0,
//         klines: klines.slice(-candlesDisplayed),
//         luxalgoTrail: luxalgoTrailData.slice(-candlesDisplayed),
//         supertrend: supertrendData.slice(-candlesDisplayed),
//         volumeProfile: volumeProfile ?? undefined,
//     };
// };

// export const fetchDexTokenDataForTable = async (address: string, settings: Settings): Promise<DexTableRowData | null> => {
//     const [details, ...kiwiDataResults] = await Promise.all([
//         fetchDexTokenDetails(address),
//         ...DEX_KIWI_TIMEFRAMES.map(tf => fetchDexSymbolData(address, tf, settings))
//     ]);
    
//     if (!details) return null;

//     const kiwiData: DexTableRowData['kiwiData'] = {
//         '5m': kiwiDataResults[0],
//         '15m': kiwiDataResults[1],
//         '1h': kiwiDataResults[2],
//         '4h': kiwiDataResults[3],
//     };
    
//     let change15m = 0;
//     const klines15m = kiwiData['15m']?.klines;
//     if (klines15m && klines15m.length >= 2) {
//         const last = klines15m[klines15m.length - 1].close;
//         const prev = klines15m[klines15m.length - 2].close;
//         if (prev > 0) {
//             change15m = ((last - prev) / prev) * 100;
//         }
//     }

//     return {
//         address,
//         name: details.name ?? 'Unknown',
//         symbol: details.symbol ?? address.substring(0, 6),
//         price: parseFloat(details.price_usd ?? '0'),
//         change24h: parseFloat(details.price_change_percentage?.h24 ?? '0'),
//         volume24h: parseFloat(details.volume_usd?.h24 ?? '0'),
//         change15m,
//         kiwiData,
//         kiwiFlips: {
//             '5m': hasRecentFlip(kiwiData['5m']?.luxalgoTrail),
//             '15m': hasRecentFlip(kiwiData['15m']?.luxalgoTrail),
//             '1h': hasRecentFlip(kiwiData['1h']?.luxalgoTrail),
//             '4h': hasRecentFlip(kiwiData['4h']?.luxalgoTrail),
//         },
//     };
// };