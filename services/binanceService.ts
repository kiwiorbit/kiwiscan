import type { SymbolData, Timeframe, RsiDataPoint, PriceDataPoint, VolumeProfileData, Settings, Kline } from '../types';
import { calculateVolumeProfile } from './volumeProfileService';
import { calculateStatisticalTrailingStop } from './luxalgoService';
import { calculateSupertrend } from './supertrendService';

const SPOT_API_BASE_URL = 'https://api.binance.com/api/v3/klines';
const FUTURES_API_BASE_URL = 'https://fapi.binance.com/fapi/v1/klines';
const FUTURES_DATA_BASE_URL = 'https://fapi.binance.com/futures/data';
const FUTURES_OI_URL = 'https://fapi.binance.com/futures/data/openInterestHist';
const FUTURES_PREMIUM_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex';

// Helper function to fetch and process OI data for a specific period
const fetchAndProcessOi = async (symbol: string, period: '5m' | '15m' | '30m', limit: number): Promise<{ history: RsiDataPoint[], change: number } | null> => {
    try {
        const url = `${FUTURES_DATA_BASE_URL}/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`;
        const response = await fetch(url);
        if (response.ok) {
            const data: { sumOpenInterest: string; timestamp: number }[] = await response.json();
            if (data && data.length === limit) {
                const history = data.slice(1).map(d => ({
                    time: d.timestamp,
                    value: parseFloat(d.sumOpenInterest)
                }));
                const startOi = parseFloat(data[0].sumOpenInterest);
                const endOi = parseFloat(data[data.length - 1].sumOpenInterest);
                const change = startOi > 0 ? ((endOi - startOi) / startOi) * 100 : (endOi > 0 ? Infinity : 0);
                return { history, change };
            }
        }
    } catch (error) {
        // fail silently for spot or other errors
    }
    return null;
}

export const fetchKlines = async (symbol: string, interval: string, limit: number): Promise<any[][] | null> => {
    let apiSymbol = symbol;
    let baseUrl = SPOT_API_BASE_URL;

    if (symbol.endsWith('.P')) {
        apiSymbol = symbol.slice(0, -2);
        baseUrl = FUTURES_API_BASE_URL;
    }

    const url = `${baseUrl}?symbol=${apiSymbol}&interval=${interval}&limit=${limit}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch klines for ${symbol}: ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching klines for ${symbol}:`, error);
        return null;
    }
};

const calculateRSI = (klines: any[][], length: number): RsiDataPoint[] => {
    const closes = klines.map((k: any[]) => parseFloat(k[4]));
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
        time: klines[length + index][0],
        value: value,
    }));

    return rsiDataPoints;
};

const calculateSMA = (data: RsiDataPoint[], length: number): RsiDataPoint[] => {
    if (data.length < length) return [];
    const smaValues: RsiDataPoint[] = [];
    for (let i = length - 1; i < data.length; i++) {
        const sum = data.slice(i - length + 1, i + 1).reduce((acc, point) => acc + point.value, 0);
        smaValues.push({
            time: data[i].time,
            value: sum / length,
        });
    }
    return smaValues;
};

const calculateStochRSI = (rsiData: RsiDataPoint[], rsiLength: number, stochLength: number, kSmooth: number, dSmooth: number) => {
    if (rsiData.length < rsiLength + stochLength) return { stochK: [], stochD: [] };
    
    const stochRsiValues: number[] = [];
    for (let i = stochLength - 1; i < rsiData.length; i++) {
        const rsiWindow = rsiData.slice(i - stochLength + 1, i + 1).map(p => p.value);
        const highestRsi = Math.max(...rsiWindow);
        const lowestRsi = Math.min(...rsiWindow);
        const currentRsi = rsiData[i].value;

        const stochRsi = (highestRsi - lowestRsi) === 0 ? 0 : (currentRsi - lowestRsi) / (highestRsi - lowestRsi) * 100;
        stochRsiValues.push(stochRsi);
    }
    
    const kDataPoints: RsiDataPoint[] = [];
    for(let i = kSmooth - 1; i < stochRsiValues.length; i++) {
        const kWindow = stochRsiValues.slice(i - kSmooth + 1, i + 1);
        const kValue = kWindow.reduce((sum, val) => sum + val, 0) / kSmooth;
        kDataPoints.push({ time: rsiData[stochLength - 1 + i].time, value: kValue });
    }

    const dDataPoints: RsiDataPoint[] = [];
    for(let i = dSmooth - 1; i < kDataPoints.length; i++) {
        const dWindow = kDataPoints.slice(i - dSmooth + 1, i + 1).map(p => p.value);
        const dValue = dWindow.reduce((sum, val) => sum + val, 0) / dSmooth;
        dDataPoints.push({ time: kDataPoints[i].time, value: dValue });
    }

    return { stochK: kDataPoints, stochD: dDataPoints };
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

export const fetchDailyVwap = async (symbol: string): Promise<number | null> => {
    let apiSymbol = symbol;
    let baseUrl = SPOT_API_BASE_URL;

    if (symbol.endsWith('.P')) {
        apiSymbol = symbol.slice(0, -2);
        baseUrl = FUTURES_API_BASE_URL;
    } else {
        const futuresCheckUrl = `${FUTURES_API_BASE_URL}?symbol=${apiSymbol}&interval=30m&limit=1`;
        try {
            const res = await fetch(futuresCheckUrl);
            if(res.ok) baseUrl = FUTURES_API_BASE_URL;
        } catch(e) { /* fallback to spot */ }
    }
    
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const startTime = today.getTime();

        const dailyUrl = `${baseUrl}?symbol=${apiSymbol}&interval=30m&startTime=${startTime}&limit=48`; // 48 candles for a full day
        const dailyResponse = await fetch(dailyUrl);
        if (!dailyResponse.ok) return null;
        
        const dailyKlinesRaw: any[][] = await dailyResponse.json();
        
        if (dailyKlinesRaw.length > 0) {
            const dailyPriceDataPoints: PriceDataPoint[] = dailyKlinesRaw.map(k => ({
                time: k[0],
                open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
                quoteVolume: parseFloat(k[7]),
                takerBuyVolume: parseFloat(k[9]),
                takerBuyQuoteVolume: parseFloat(k[10]),
            }));
            const dailyVwapData = calculateVWAP(dailyPriceDataPoints);
            return dailyVwapData.length > 0 ? dailyVwapData[dailyVwapData.length - 1].value : null;
        }
    } catch (error) {
        console.error(`Failed to fetch or calculate daily VWAP for ${symbol}:`, error);
    }
    return null;
}


const findPivots = (klines: PriceDataPoint[], lookback: number, isHigh: boolean): number | null => {
    // Find the most recent pivot
    for (let i = klines.length - 1 - lookback; i >= lookback; i--) {
        const centerKline = klines[i];
        const pivotValue = isHigh ? centerKline.high : centerKline.low;
        let isPivot = true;
        // Check left and right
        for (let j = 1; j <= lookback; j++) {
            const leftValue = isHigh ? klines[i - j].high : klines[i - j].low;
            const rightValue = isHigh ? klines[i + j].high : klines[i + j].high;
            if ((isHigh && (leftValue > pivotValue || rightValue > pivotValue)) ||
                (!isHigh && (leftValue < pivotValue || rightValue < pivotValue))) {
                isPivot = false;
                break;
            }
        }
        if (isPivot) {
            return i; // Return index of the pivot kline
        }
    }
    return null; // No pivot found
};

const calculateHeikinAshi = (klines: PriceDataPoint[]): PriceDataPoint[] => {
    if (klines.length === 0) return [];

    const haKlines: PriceDataPoint[] = [];

    for (let i = 0; i < klines.length; i++) {
        const p = klines[i];
        
        const haClose = (p.open + p.high + p.low + p.close) / 4;
        let haOpen: number;

        if (i === 0) {
            haOpen = (p.open + p.close) / 2;
        } else {
            const prevHa = haKlines[i - 1];
            haOpen = (prevHa.open + prevHa.close) / 2;
        }

        const haHigh = Math.max(p.high, haOpen, haClose);
        const haLow = Math.min(p.low, haOpen, haClose);

        haKlines.push({
            time: p.time,
            open: haOpen,
            high: haHigh,
            low: haLow,
            close: haClose,
            // Keep original volume data
            volume: p.volume,
            quoteVolume: p.quoteVolume,
            takerBuyVolume: p.takerBuyVolume,
            takerBuyQuoteVolume: p.takerBuyQuoteVolume,
        });
    }

    return haKlines;
};

export const fetchRsiForSymbol = async (symbol: string, timeframe: Timeframe, settings: Settings): Promise<SymbolData> => {
    let apiSymbol = symbol;
    let baseUrl = SPOT_API_BASE_URL;
    const { candlesDisplayed } = settings;

    if (symbol.endsWith('.P')) {
        apiSymbol = symbol.slice(0, -2);
        baseUrl = FUTURES_API_BASE_URL;
    }

    const rsiLength = 14;
    const smaLength = 14;
    const sma50Length = 50;
    const sma100Length = 100;
    const stochLength = 14;
    const kSmooth = 3;
    const dSmooth = 3;
    const supertrendPeriod = 10;
    const supertrendMultiplier = 1.0;
    
    // Calculate required candles for AVB lookback
    const { lookbackPeriod } = settings.anomalousBuyingVolumeSettings;
    let avbLookbackCandles = 0;
    if (lookbackPeriod.endsWith('h')) {
        const timeframeMinutesMap: { [key in Timeframe]?: number } = {
            '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '2h': 120, '4h': 240, '8h': 480, '1d': 1440, '3d': 4320, '1w': 10080
        };
        const timeframeMinutes = timeframeMinutesMap[timeframe];
        if (timeframeMinutes) {
            const lookbackHours = parseInt(lookbackPeriod.replace('h', ''), 10);
            avbLookbackCandles = Math.round((lookbackHours * 60) / timeframeMinutes);
        }
    }

    const maxLookback = Math.max(rsiLength + stochLength + kSmooth + dSmooth, sma100Length, supertrendPeriod, avbLookbackCandles);
    const fetchLimit = candlesDisplayed + maxLookback + 100; // Extra buffer for LuxAlgo and KiwiHunt
    
    const url = `${baseUrl}?symbol=${apiSymbol}&interval=${timeframe}&limit=${fetchLimit}`;
    const response = await fetch(url);
    if (!response.ok) {
        return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
    }
    const klines: any[][] = await response.json();
    
    if (klines.length === 0) {
        return { rsi: [], sma: [], priceSma: [], stochK: [], stochD: [], vwap: [], price: 0, volume: 0, quoteVolume: 0, klines: [] };
    }

    // --- Open Interest Fetch ---
    let openInterestHistory: SymbolData['openInterestHistory'] = {};
    let openInterestChange: SymbolData['openInterestChange'] = {};
    
    try {
        const oiPromises = [
            fetchAndProcessOi(apiSymbol, '5m', 13),  // 1h (12 * 5m intervals + 1)
            fetchAndProcessOi(apiSymbol, '15m', 17), // 4h (16 * 15m intervals + 1)
            fetchAndProcessOi(apiSymbol, '30m', 17) // 8h (16 * 30m intervals + 1)
        ];
        
        const [oi1h, oi4h, oi8h] = await Promise.all(oiPromises);
        
        if (oi1h) {
            openInterestHistory['1h'] = oi1h.history;
            openInterestChange['1h'] = oi1h.change;
        }
        if (oi4h) {
            openInterestHistory['4h'] = oi4h.history;
            openInterestChange['4h'] = oi4h.change;
        }
        if (oi8h) {
            openInterestHistory['8h'] = oi8h.history;
            openInterestChange['8h'] = oi8h.change;
        }

    } catch (error) {
        // Gracefully fail
    }


    const priceDataPoints: PriceDataPoint[] = klines.map(k => ({
        time: k[0],
        open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7]),
        takerBuyVolume: parseFloat(k[9]),
        takerBuyQuoteVolume: parseFloat(k[10]),
    }));

    // --- Heikin Ashi Smoothing for Trail ---
    const klinesForTrail = settings.trailingStopSettings.useHeikinAshiForTrail
        ? calculateHeikinAshi(priceDataPoints)
        : priceDataPoints;
    
    const priceObjectsForSma = priceDataPoints.map(p => ({ time: p.time, value: p.close }));

    const price = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].close : 0;
    const volume = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].volume : 0;
    const quoteVolume = priceDataPoints.length > 0 ? priceDataPoints[priceDataPoints.length - 1].quoteVolume : 0;

    const rsiData = calculateRSI(klines, rsiLength);
    const smaData = calculateSMA(rsiData, smaLength);
    const priceSmaData = calculateSMA(priceObjectsForSma, smaLength);
    const priceSma50Data = calculateSMA(priceObjectsForSma, sma50Length);
    const priceSma100Data = calculateSMA(priceObjectsForSma, sma100Length);
    const { stochK, stochD } = calculateStochRSI(rsiData, rsiLength, stochLength, kSmooth, dSmooth);
    const vwapData = calculateVWAP(priceDataPoints);
    const volumeProfile = calculateVolumeProfile(priceDataPoints.slice(-candlesDisplayed));
    const luxalgoTrailData = calculateStatisticalTrailingStop(klinesForTrail, settings);
    const supertrendData = calculateSupertrend(priceDataPoints, supertrendPeriod, supertrendMultiplier);
    
    // --- CVD Calculation ---
    const cvdData: RsiDataPoint[] = [];
    let cumulativeDelta = 0;
    for (const kline of priceDataPoints) {
        const delta = kline.takerBuyQuoteVolume * 2 - kline.quoteVolume;
        cumulativeDelta += delta;
        cvdData.push({ time: kline.time, value: cumulativeDelta });
    }

    let dailyVwapData: RsiDataPoint[] | undefined = undefined;
    if (timeframe === '30m' && klines.length > 0) {
        try {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const startTime = today.getTime();

            const dailyUrl = `${baseUrl}?symbol=${apiSymbol}&interval=30m&startTime=${startTime}&limit=48`; // limit 48 for a full day
            const dailyResponse = await fetch(dailyUrl);
            const dailyKlinesRaw: any[][] = await dailyResponse.json();
            
            if (dailyKlinesRaw.length > 0) {
                const dailyPriceDataPoints: PriceDataPoint[] = dailyKlinesRaw.map(k => ({
                    time: k[0],
                    open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
                    volume: parseFloat(k[5]),
                    quoteVolume: parseFloat(k[7]),
                    takerBuyVolume: parseFloat(k[9]),
                    takerBuyQuoteVolume: parseFloat(k[10]),
                }));
                dailyVwapData = calculateVWAP(dailyPriceDataPoints);
            }
        } catch (error) {
            console.error(`Failed to fetch or calculate daily VWAP for ${symbol}:`, error);
        }
    }

    // --- Anchored VWAP Calculations ---
    let vwapAnchoredHigh: RsiDataPoint[] | undefined = undefined;
    let vwapAnchoredLow: RsiDataPoint[] | undefined = undefined;
    
    const highPivotIndex = findPivots(priceDataPoints, 5, true);
    if (highPivotIndex !== null) {
        const klinesFromHigh = priceDataPoints.slice(highPivotIndex);
        vwapAnchoredHigh = calculateVWAP(klinesFromHigh);
    }
    
    const lowPivotIndex = findPivots(priceDataPoints, 5, false);
    if (lowPivotIndex !== null) {
        const klinesFromLow = priceDataPoints.slice(lowPivotIndex);
        vwapAnchoredLow = calculateVWAP(klinesFromLow);
    }

    const sliceData = <T,>(arr: T[] | undefined): T[] | undefined => arr ? arr.slice(-candlesDisplayed) : undefined;


    return {
        rsi: rsiData.slice(-candlesDisplayed), sma: smaData.slice(-candlesDisplayed), 
        priceSma: priceSmaData.slice(-candlesDisplayed),
        priceSma50: priceSma50Data.slice(-candlesDisplayed),
        priceSma100: priceSma100Data.slice(-candlesDisplayed),
        stochK: stochK.slice(-candlesDisplayed), stochD: stochD.slice(-candlesDisplayed), 
        vwap: vwapData.slice(-candlesDisplayed),
        dailyVwap: dailyVwapData,
        vwapAnchoredHigh,
        vwapAnchoredLow,

        openInterestHistory: Object.keys(openInterestHistory).length > 0 ? openInterestHistory : undefined,
        openInterestChange: Object.keys(openInterestChange).length > 0 ? openInterestChange : undefined,
        price, volume, quoteVolume, klines: priceDataPoints.slice(-candlesDisplayed),
        volumeProfile: volumeProfile ?? undefined,
        luxalgoTrail: luxalgoTrailData.slice(-candlesDisplayed),
        supertrend: supertrendData.slice(-candlesDisplayed),
        cvd: cvdData.slice(-candlesDisplayed),
    };
};