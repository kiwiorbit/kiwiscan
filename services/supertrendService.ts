
import type { PriceDataPoint } from '../types';

// Helper for nz() function in Pine Script
const nz = (value: number | undefined, replacement = 0) => (value === undefined || isNaN(value) ? replacement : value);

// Helper for sma() function
const sma = (source: number[], length: number): number => {
    if (source.length < length) return 0;
    const useLength = Math.min(source.length, length);
    const series = source.slice(-useLength);
    const sum = series.reduce((a, b) => a + b, 0);
    return sum / useLength;
};

export const calculateSupertrend = (
    klines: PriceDataPoint[],
    period: number,
    multiplier: number
): { time: number; up: number | null; dn: number | null; trend: number }[] => {
    if (klines.length < period) return [];

    const results: { time: number; up: number | null; dn: number | null; trend: number }[] = [];
    const trueRanges: number[] = [];

    let trend = 1;
    let up = 0;
    let dn = 0;

    for (let i = 0; i < klines.length; i++) {
        const kline = klines[i];
        const prevKline = i > 0 ? klines[i - 1] : kline;
        
        const tr = Math.max(
            kline.high - kline.low,
            Math.abs(kline.high - prevKline.close),
            Math.abs(kline.low - prevKline.close)
        );
        trueRanges.push(tr);

        if (i < period) {
            results.push({ time: kline.time, up: null, dn: null, trend: 1 });
            continue;
        }

        const atr = sma(trueRanges.slice(i - period + 1, i + 1), period);
        
        const src = (kline.high + kline.low) / 2; // hl2 source

        let newUp = src - multiplier * atr;
        const up1 = nz(results[i - 1]?.up, newUp);
        newUp = klines[i-1].close > up1 ? Math.max(newUp, up1) : newUp;

        let newDn = src + multiplier * atr;
        const dn1 = nz(results[i-1]?.dn, newDn);
        newDn = klines[i-1].close < dn1 ? Math.min(newDn, dn1) : newDn;

        const prevTrend = results[i - 1]?.trend ?? 1;
        
        let newTrend = prevTrend;
        if (prevTrend === -1 && kline.close > dn1) {
            newTrend = 1;
        } else if (prevTrend === 1 && kline.close < up1) {
            newTrend = -1;
        }

        results.push({
            time: kline.time,
            up: newUp,
            dn: newDn,
            trend: newTrend,
        });
    }
    
    // Replace initial nulls with calculated values for cleaner chart
    for (let i = 0; i < results.length; i++) {
        if (results[i].trend === 1) {
            results[i].dn = null;
        } else {
            results[i].up = null;
        }
    }

    return results;
};