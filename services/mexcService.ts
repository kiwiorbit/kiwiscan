import type { RsiDataPoint, SymbolData, Timeframe, Settings, PriceDataPoint, MexcTableRowData, MexcKiwiData, MexcKiwiFlips } from '../types';
import { calculateStatisticalTrailingStop } from './luxalgoService';
import { calculateSupertrend } from './supertrendService';
import { calculateVolumeProfile } from './volumeProfileService';

const API_BASE_URL = 'https://corsproxy.io/?https://api.mexc.com/api/v3';

const hasRecentFlip = (trail?: { bias: number }[]): boolean => {
    if (!trail || trail.length < 2) return false;
    const len = trail.length;
    if (trail[len - 1].bias !== trail[len - 2].bias) return true;
    if (len >= 3 && trail[len - 2].bias !== trail[len - 3].bias) return true;
    return false;
};

export const fetchMexcKlines = async (symbol: string, interval: string, limit: number, signal?: AbortSignal): Promise<any[][] | null> => {
    const url = `${API_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
            console.warn(`Failed to fetch MEXC klines for ${symbol} (${interval}): ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error(`Error fetching MEXC klines for ${symbol} (${interval}):`, error);
        }
        return null;
    }
};

const calculateRSI = (klines: PriceDataPoint[], length: number): RsiDataPoint[] => {
    const closes = klines.map(k => k.close);
    if (closes.length <= length) return [];

    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(Math.max(0, change));
        losses.push(Math.max(0, -change));
    }

    let avgGain = gains.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
    let avgLoss = losses.slice(0, length).reduce((sum, val) => sum + val, 0) / length;

    const rsiValues: number[] = [];
    for (let i = length; i < gains.length; i++) {
        const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);

        avgGain = (avgGain * (length - 1) + gains[i]) / length;
        avgLoss = (avgLoss * (length - 1) + losses[i]) / length;
    }
    
    const rsiDataPoints: RsiDataPoint[] = rsiValues.map((value, index) => ({
        time: klines[length + index].time,
        value: value,
    }));

    return rsiDataPoints;
};

export const calculateVWAP = (klines: PriceDataPoint[]): RsiDataPoint[] => {
    if (klines.length === 0) return [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    const vwapData: RsiDataPoint[] = [];

    for (const kline of klines) {
        const typicalPrice = (kline.high + kline.low + kline.close) / 3;
        const tpv = typicalPrice * kline.volume;
        
        cumulativeTPV += tpv;
        cumulativeVolume += kline.volume;

        const vwap = cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume;
        vwapData.push({ time: kline.time, value: vwap });
    }
    return vwapData;
};

export const fetchDailyVwap = async (symbol: string, signal?: AbortSignal): Promise<number | null> => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const startTime = today.getTime();

        const dailyKlinesRaw = await fetchMexcKlines(symbol, '30m', 48, signal);
        
        if (dailyKlinesRaw && dailyKlinesRaw.length > 0) {
            const dailyPriceDataPoints: PriceDataPoint[] = dailyKlinesRaw.map(k => ({
                time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
                volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), numberOfTrades: k[8],
                takerBuyVolume: parseFloat(k[9]), takerBuyQuoteVolume: parseFloat(k[10]),
            }));
            const dailyVwapData = calculateVWAP(dailyPriceDataPoints);
            return dailyVwapData.length > 0 ? dailyVwapData[dailyVwapData.length - 1].value : null;
        }
    } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
             console.error(`Failed to fetch or calculate daily VWAP for MEXC symbol ${symbol}:`, error);
        }
    }
    return null;
}


export const fetchMexcSymbolData = async (symbol: string, timeframe: Timeframe, settings: Settings, signal?: AbortSignal): Promise<SymbolData> => {
    const { candlesDisplayed } = settings;
    const fetchLimit = candlesDisplayed + 300; // Buffer for calculations
    
    // Note: MEXC API does not support '3m'. '1m' and '5m' are used instead.
    const validTimeframe = timeframe === '3m' ? '5m' : timeframe;
    
    const rawKlines = await fetchMexcKlines(symbol, validTimeframe, fetchLimit, signal);
    if (!rawKlines || rawKlines.length === 0) {
        return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
    }

    const klines: PriceDataPoint[] = rawKlines.map(k => ({
        time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
        volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), numberOfTrades: k[8],
        takerBuyVolume: parseFloat(k[9]), takerBuyQuoteVolume: parseFloat(k[10]),
    }));

    const price = klines.length > 0 ? klines[klines.length - 1].close : 0;
    const volume = klines.length > 0 ? klines[klines.length - 1].volume : 0;
    const quoteVolume = klines.length > 0 ? klines[klines.length - 1].quoteVolume : 0;
    
    const rsiData = calculateRSI(klines, 14);
    const luxalgoTrailData = calculateStatisticalTrailingStop(klines, settings);
    const supertrendData = calculateSupertrend(klines, 10, 1.0);
    const volumeProfile = calculateVolumeProfile(klines.slice(-candlesDisplayed));

    return {
        rsi: rsiData.slice(-candlesDisplayed), sma: [], priceSma: [], stochK: [], stochD: [], vwap: [],
        price, volume, quoteVolume,
        klines: klines.slice(-candlesDisplayed),
        luxalgoTrail: luxalgoTrailData.slice(-candlesDisplayed),
        supertrend: supertrendData.slice(-candlesDisplayed),
        volumeProfile: volumeProfile ?? undefined,
    };
};

export const fetchTopGainersList = async (limit: number, signal: AbortSignal): Promise<string[]> => {
    const tickerUrl = `${API_BASE_URL}/ticker/24hr`;
    const response = await fetch(tickerUrl, { signal });
    if (!response.ok) throw new Error('Failed to fetch MEXC tickers');
    
    const allTickers: any[] = await response.json();
    const usdtTickers = allTickers.filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 20000);

    usdtTickers.sort((a: any, b: any) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
    
    return usdtTickers.slice(0, limit).map(t => t.symbol);
};

export const fetchDetailedDataForSymbolChunk = async (
    symbols: string[],
    settings: Settings,
    signal: AbortSignal
): Promise<(MexcTableRowData | null)[]> => {

    const detailedDataPromises = symbols.map(async (symbol): Promise<MexcTableRowData | null> => {
        try {
            const tickerUrl = `${API_BASE_URL}/ticker/24hr?symbol=${symbol}`;
            
            const [
                tickerRes,
                kiwi1m, kiwi5m, kiwi15m,
                klines5m,
                dailyVwap
            ] = await Promise.all([
                fetch(tickerUrl, { signal }),
                fetchMexcSymbolData(symbol, '1m', settings, signal),
                fetchMexcSymbolData(symbol, '5m', settings, signal),
                fetchMexcSymbolData(symbol, '15m', settings, signal),
                fetchMexcKlines(symbol, '5m', 2, signal),
                fetchDailyVwap(symbol, signal),
            ]);

            if (signal.aborted) return null;
            // Crucial check: Ensure we have kline data to prevent adding untrackable pairs.
            if (!klines5m || klines5m.length < 2) {
                console.warn(`Skipping ${symbol} due to missing kline data.`);
                return null;
            }

            const ticker = await tickerRes.json();
            
            const change5m = ((parseFloat(klines5m[1][4]) - parseFloat(klines5m[0][4])) / parseFloat(klines5m[0][4])) * 100;
            const rsi5m = kiwi5m.rsi?.[kiwi5m.rsi.length - 1]?.value ?? 0;
            
            const kiwiData: MexcKiwiData = { '1m': kiwi1m, '5m': kiwi5m, '15m': kiwi15m };
            const kiwiFlips: MexcKiwiFlips = {
                '1m': hasRecentFlip(kiwi1m?.luxalgoTrail),
                '5m': hasRecentFlip(kiwi5m?.luxalgoTrail),
                '15m': hasRecentFlip(kiwi15m?.luxalgoTrail),
            };

            return {
                symbol,
                price: parseFloat(ticker.lastPrice),
                change24h: parseFloat(ticker.priceChangePercent) * 100,
                volume24h: parseFloat(ticker.quoteVolume),
                change5m,
                rsi5m,
                dailyVwap,
                kiwiData,
                kiwiFlips,
            };
        } catch (e) {
             if (e instanceof Error && e.name !== 'AbortError') {
                console.warn(`Could not fetch all chunk data for MEXC symbol ${symbol}`, e);
             }
            return null;
        }
    });
    
    return Promise.all(detailedDataPromises);
};