import type { PriceDataPoint, HighLowAlgoSettings, HighLowAlgoSignalPoint } from '../types';

/**
 * Calculates signals and channel data based on the Ay4nbolic Algo logic.
 * @param {PriceDataPoint[]} klines - Array of kline data objects from Binance.
 * @param {HighLowAlgoSettings} settings - The user-configurable settings for the algorithm.
 * @returns An object containing both the signals and the channel data for charting.
 */
export const calculateHighLowAlgo = (
    klines: PriceDataPoint[],
    settings: HighLowAlgoSettings
): { signals: HighLowAlgoSignalPoint[], channel: { time: number; high: number; low: number }[] } => {
    if (klines.length <= settings.dist) {
        return { signals: [], channel: [] };
    }

    const signals: HighLowAlgoSignalPoint[] = [];
    const channel: { time: number; high: number; low: number }[] = [];
    let direction: 'none' | 'buy' | 'sell' = 'none';
    let slLevel: number | null = null;
    let signalBarIndex: number | null = null;

    for (let i = settings.dist; i < klines.length; i++) {
        const currentCandle = klines[i];
        const lookbackCandles = klines.slice(i - settings.dist, i);

        // --- Channel Calculation ---
        const hh = Math.max(...lookbackCandles.map(c => c.high));
        const ll = Math.min(...lookbackCandles.map(c => c.low));
        channel.push({ time: currentCandle.time, high: hh, low: ll });
        
        const isHigh = currentCandle.high >= Math.max(...klines.slice(i - settings.dist, i + 1).map(c => c.high));

        // --- Signal Conditions ---
        const nearLow = currentCandle.low <= ll * (1 + settings.buy_threshold_pct / 100);
        const nearHigh = currentCandle.high >= hh * (1 - settings.sell_threshold_pct / 100);

        // --- Candle Patterns ---
        const body = Math.abs(currentCandle.close - currentCandle.open);
        const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
        const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
        const range = currentCandle.high - currentCandle.low;

        const isHammer = lowerWick >= settings.hammer_wick_ratio * body && upperWick <= body * 0.5;
        const isDoji = range > 0 && body <= settings.doji_body_ratio * range;
        const greenCandle = currentCandle.close > currentCandle.open;
        const redCandle = currentCandle.close < currentCandle.open;

        // --- Entry/Exit Mode Checks ---
        let buyOk = false;
        if (settings.buy_mode === "Default") buyOk = true;
        else if (settings.buy_mode === "Hammer") buyOk = isHammer;
        else if (settings.buy_mode === "Green Close") buyOk = greenCandle;
        else if (settings.buy_mode === "Hammer + Green") buyOk = isHammer && greenCandle;
        
        let sellOk = false;
        if (settings.sell_mode === "Default") sellOk = true;
        else if (settings.sell_mode === "Red Close") sellOk = redCandle;
        else if (settings.sell_mode === "Doji") sellOk = isDoji;
        else if (settings.sell_mode === "Doji + Red Close") sellOk = isDoji && redCandle;
        
        // --- State Machine Logic ---
        let slTriggered = false;
        if (settings.sl_mode === "Signal Candle Low" && direction === "buy" && slLevel) {
            const priceToCheck = settings.intrabarSL ? currentCandle.low : currentCandle.close;
            if (priceToCheck <= slLevel) {
                slTriggered = true;
            }
        }
        
        if (slTriggered) {
            signalBarIndex = i;
            direction = "sell"; // Using sell as a generic "exit" state
            slLevel = null;
            signals.push({ type: 'SL_HIT', price: currentCandle.close, time: currentCandle.time });
        } else {
            // Check for BUY signal
            if ((signalBarIndex === null || direction === "sell") && nearLow && buyOk) {
                signalBarIndex = i;
                direction = "buy";
                if (settings.sl_mode === "Signal Candle Low") {
                    slLevel = currentCandle.low * (1 - settings.sl_buffer_pct / 100);
                }
                signals.push({ type: 'BUY', price: currentCandle.close, time: currentCandle.time });
            }
            // Check for SELL (exit) signal
            else if (direction === "buy") {
                const exitCondition = settings.sell_mode === "Default" ? (nearHigh || (isHigh && sellOk)) : (isHigh && sellOk);
                if (exitCondition) {
                    signalBarIndex = i;
                    direction = "sell";
                    slLevel = null;
                    signals.push({ type: 'SELL', price: currentCandle.close, time: currentCandle.time });
                }
            }
        }
    }
    return { signals, channel };
};
