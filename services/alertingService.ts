import type { SymbolData, Settings, Timeframe, Notification, PriceDataPoint } from '../types';

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

const ALERT_COOLDOWN = 3600000; // 1 hour to prevent spam


export const checkAllAlerts = (
    symbol: string,
    timeframe: Timeframe,
    data: SymbolData,
    settings: Settings,
    alertStates: Record<string, any>,
    setAlertStates: Dispatch<SetStateAction<Record<string, any>>>
): Omit<Notification, 'id' | 'read' | 'timestamp'>[] => {
    const alertsToFire: Omit<Notification, 'id' | 'read' | 'timestamp'>[] = [];
    
    if (
        !data.klines || data.klines.length < 2
    ) {
        return alertsToFire;
    }


    const { alertConditions } = settings;
    const now = Date.now();
    
    const canFire = (type: string) => {
        const key = `${symbol}-${timeframe}-${type}`;
        const lastFired = alertStates[key];
        // For event-based alerts (with timestamps), we don't need a cooldown, just check if it fired.
        // For state-based alerts, we need a cooldown.
        if (type.includes('-') && !isNaN(parseInt(type.split('-').pop() || '', 10))) {
            return !lastFired;
        }
        return !lastFired || now - lastFired > ALERT_COOLDOWN;
    };

    const setFired = (type: string) => {
        setAlertStates(prev => ({ ...prev, [`${symbol}-${timeframe}-${type}`]: now }));
    };
    
    // --- LuxAlgo Statistical Trailing Stop Flip ---
    if ((alertConditions.luxalgoBullishFlip || alertConditions.luxalgoBearishFlip) && ['15m', '1h', '4h', '1d'].includes(timeframe)) {
        if (data.luxalgoTrail && data.luxalgoTrail.length >= 3) {
            const BULLISH = 1;
            const BEARISH = 0;
            const trailData = data.luxalgoTrail;
            
            // Explicitly check the last two candle transitions.
            // This prevents alerts for flips that are older than 2 candles.
            const transitions_to_check = [
                { current: trailData[trailData.length - 1], prev: trailData[trailData.length - 2] }, // Most recent transition
                { current: trailData[trailData.length - 2], prev: trailData[trailData.length - 3] }  // Second most recent transition
            ];
    
            for (const { current: currentTrail, prev: prevTrail } of transitions_to_check) {
                const klineForSignal = data.klines.find(k => k.time === currentTrail.time);
    
                if (currentTrail && prevTrail && klineForSignal) {
                    const isBullishFlip = prevTrail.bias === BEARISH && currentTrail.bias === BULLISH;
                    const isBearishFlip = prevTrail.bias === BULLISH && currentTrail.bias === BEARISH;
    
                    if (alertConditions.luxalgoBullishFlip && isBullishFlip) {
                        const uniqueAlertType = `kiwitrail-bullish-flip-${currentTrail.time}`;
                        if (canFire(uniqueAlertType)) {
                            alertsToFire.push({
                                symbol,
                                timeframe,
                                type: 'luxalgo-bullish-flip',
                                price: klineForSignal.close,
                                body: `Bias flipped to Bullish at $${klineForSignal.close.toFixed(4)}`
                            });
                            setFired(uniqueAlertType);
                        }
                    }
    
                    if (alertConditions.luxalgoBearishFlip && isBearishFlip) {
                        const uniqueAlertType = `kiwitrail-bearish-flip-${currentTrail.time}`;
                        if (canFire(uniqueAlertType)) {
                            alertsToFire.push({
                                symbol,
                                timeframe,
                                type: 'luxalgo-bearish-flip',
                                price: klineForSignal.close,
                                body: `Bias flipped to Bearish at $${klineForSignal.close.toFixed(4)}`
                            });
                            setFired(uniqueAlertType);
                        }
                    }
                }
            }
        }
    }

    // --- Supertrend Flip Alerts ---
    if ((alertConditions.supertrendBuy || alertConditions.supertrendSell) && ['4h', '1d'].includes(timeframe)) {
        if (data.supertrend && data.supertrend.length >= 2) {
            const supertrendData = data.supertrend;

            // Check only the most recent candle transition for an immediate alert.
            const currentSt = supertrendData[supertrendData.length - 1];
            const prevSt = supertrendData[supertrendData.length - 2];
            const klineForSignal = data.klines.find(k => k.time === currentSt.time);

            if (currentSt && prevSt && klineForSignal) {
                // Bullish Flip (Buy Signal)
                if (alertConditions.supertrendBuy) {
                    const isBullishFlip = currentSt.trend === 1 && prevSt.trend === -1;
                    if (isBullishFlip) {
                        const uniqueAlertType = `supertrend-buy-${currentSt.time}`;
                        if (canFire(uniqueAlertType)) {
                            alertsToFire.push({
                                symbol,
                                timeframe,
                                type: 'supertrend-buy',
                                price: klineForSignal.close,
                            });
                            setFired(uniqueAlertType);
                        }
                    }
                }

                // Bearish Flip (Sell Signal)
                if (alertConditions.supertrendSell) {
                    const isBearishFlip = currentSt.trend === -1 && prevSt.trend === 1;
                    if (isBearishFlip) {
                        const uniqueAlertType = `supertrend-sell-${currentSt.time}`;
                        if (canFire(uniqueAlertType)) {
                            alertsToFire.push({
                                symbol,
                                timeframe,
                                type: 'supertrend-sell',
                                price: klineForSignal.close,
                            });
                            setFired(uniqueAlertType);
                        }
                    }
                }
            }
        }
    }


    return alertsToFire;
};