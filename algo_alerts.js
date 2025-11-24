// A self-contained Node.js script to check for Ay4nbolic Algo v6 alerts and send them to Discord.
// This is designed to be run in a cloud environment (like Render Cron Jobs).

import https from 'https';

// =================================================================================================
// --- CONFIGURATION ---
// =================================================================================================
// All user-configurable settings are in this section.

const CONFIG = {
    // --- ALGORITHM PARAMETERS ---
    // See highlowalgo.txt for detailed explanations of these settings.
    ALGO_SETTINGS: {
        dist: 30,                               // Lookback Distance for high/low channel
        buy_threshold_pct: 0.5,                 // How close to the channel low to consider a buy signal (%)
        sell_threshold_pct: 0.3,                // How close to the channel high to consider a sell signal (%)
        buy_mode: "Green Close",                // "Default", "Hammer", "Green Close", "Hammer + Green"
        sell_mode: "Red Close",                 // "Default", "Red Close", "Doji", "Doji + Red Close"
        hammer_wick_ratio: 1.0,                 // Lower wick must be >= this multiple of the body size
        doji_body_ratio: 0.5,                   // Body must be <= this multiple of the total candle range
        sl_mode: "Signal Candle Low",           // "None", "Signal Candle Low"
        sl_buffer_pct: 0.5,                     // Buffer below the signal candle's low for the SL (%)
        intrabarSL: true,                       // true: SL triggers on low wick; false: SL triggers on close
    },

    // --- SYMBOLS & TIMEFRAMES ---
    // Define which symbols to scan on which timeframes.
    SYMBOLS: [
        "PAXGUSDT", "BTCUSDT", "SOLUSDT", "ETHUSDT", "BNBUSDT",
        "ZECUSDT", "TAOUSDT", "AVAXUSDT", "ASTERUSDT", "XRPUSDT", "SUIUSDT"
    ],
    TIMEFRAMES: ["5m", "15m", "30m", "1h"],

    // --- SECRETS & API ---
    // These should be set as environment variables in your hosting provider (e.g., Render).
    // It's recommended to use a separate webhook and bin ID for this bot to keep alerts organized.
    SECRETS: {
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL_ALGO || process.env.DISCORD_WEBHOOK_URL,
        JSONBIN_API_KEY: process.env.JSONBIN_API_KEY,
        JSONBIN_BIN_ID: process.env.JSONBIN_BIN_ID_ALGO || process.env.JSONBIN_BIN_ID,
    },

    // --- SCRIPT BEHAVIOR ---
    // How many historical candles to fetch for the calculation. Should be > dist.
    KLINE_FETCH_LIMIT: 300,
    // Pause between processing each symbol/timeframe pair to avoid API rate limits.
    REQUEST_DELAY_MS: 1500,
};

// =================================================================================================
// --- UTILITIES ---
// =================================================================================================

// Simple Fetch Implementation for Node.js
const fetch = (url, options = {}) => new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                 reject(new Error(`Request Failed. Status Code: ${res.statusCode}. URL: ${url}. Body: ${data}`));
                 return;
            }
            try {
                // Attempt to parse as JSON, but fall back to text if it fails
                const json = JSON.parse(data);
                resolve({ json: () => json, ok: true, text: () => Promise.resolve(data) });
            } catch (e) {
                resolve({ json: () => Promise.reject(new Error("Not a valid JSON")), ok: true, text: () => Promise.resolve(data) });
            }
        });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
});

// State Management using JSONBin.io
const loadState = async () => {
    const { JSONBIN_API_KEY, JSONBIN_BIN_ID } = CONFIG.SECRETS;
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return {};
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        const data = await res.json();
        console.log("Successfully loaded alert state from JSONBin.");
        return data.record || {};
    } catch (e) {
        console.error("Could not load state from JSONBin, starting fresh.", e.message);
        return {};
    }
};

const saveState = async (state) => {
    const { JSONBIN_API_KEY, JSONBIN_BIN_ID } = CONFIG.SECRETS;
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return;
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(state)
        });
        console.log("Successfully saved alert state to JSONBin.");
    } catch (e) {
        console.error("Error saving state to JSONBin:", e.message);
    }
};

// Discord Webhook Sender
const sendDiscordWebhook = async (notification) => {
    console.log(`[!] SENDING DISCORD NOTIFICATION for ${notification.symbol}`);
    const { type, symbol, timeframe, signal } = notification;

    const colorMap = { 'BUY': 3066993, 'SELL': 15158332, 'SL_HIT': 10038562 };
    const titleMap = { 'BUY': '📈 BUY Signal', 'SELL': '📉 SELL Signal', 'SL_HIT': '❌ STOP LOSS Hit' };
    const timeframeMap = { '5m': '5', '15m': '15', '30m': '30', '1h': '60' };
    
    const tradingViewURL = `https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol.replace('.P', '')}&interval=${timeframeMap[timeframe] || ''}`;

    const embed = {
        title: `${titleMap[type]}: ${symbol} (${timeframe})`,
        description: `Ay4nbolic Algo triggered a **${type.replace('_', ' ')}** signal.`,
        color: colorMap[type] || 10070709,
        fields: [
            { name: 'Price', value: `$${signal.price.toPrecision(6)}`, inline: true },
        ],
        footer: { text: "Ay4nbolic Algo v6" },
        timestamp: new Date(signal.candle.time).toISOString()
    };

    if (signal.buyCondition) {
        embed.fields.push({ name: 'Buy Condition', value: signal.buyCondition, inline: true });
        if (CONFIG.ALGO_SETTINGS.sl_mode === "Signal Candle Low") {
            const slPrice = signal.candle.low * (1 - CONFIG.ALGO_SETTINGS.sl_buffer_pct / 100);
            embed.fields.push({ name: 'Stop Loss Level', value: `$${slPrice.toPrecision(6)}`, inline: true });
        }
    }
    if (signal.sellCondition) {
        embed.fields.push({ name: 'Sell Condition', value: signal.sellCondition, inline: true });
    }
    
    embed.fields.push({ name: 'Chart', value: `[View on TradingView](${tradingViewURL})`, inline: false });

    const payload = JSON.stringify({ embeds: [embed] });
    return fetch(CONFIG.SECRETS.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    }).catch(e => console.error(`Error sending webhook: ${e.message}`));
};

// =================================================================================================
// --- ALGORITHM IMPLEMENTATION ---
// =================================================================================================

/**
 * Calculates signals based on the Ay4nbolic Algo logic for a given set of klines.
 * @param {Array<Object>} klines - Array of kline data objects from Binance.
 * @param {Object} config - The ALGO_SETTINGS object.
 * @returns {Object|null} A signal object if a new signal occurred on the last candle, otherwise null.
 */
const calculateAlgoSignals = (klines, config) => {
    if (klines.length <= config.dist) {
        return null;
    }

    let direction = "none";
    let slLevel = null;
    let newSignal = null;

    for (let i = config.dist; i < klines.length; i++) {
        const currentCandle = klines[i];
        const lookbackCandles = klines.slice(i - config.dist, i);

        // --- Channel Calculation ---
        const hh = Math.max(...lookbackCandles.map(c => c.high));
        const ll = Math.min(...lookbackCandles.map(c => c.low));

        // --- Signal Conditions ---
        const nearLow = currentCandle.low <= ll * (1 + config.buy_threshold_pct / 100);
        const isHigh = currentCandle.high >= Math.max(...klines.slice(i - config.dist, i + 1).map(c => c.high));

        // --- Candle Patterns ---
        const body = Math.abs(currentCandle.close - currentCandle.open);
        const lowerWick = Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
        const upperWick = currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
        const range = currentCandle.high - currentCandle.low;

        const isHammer = lowerWick >= config.hammer_wick_ratio * body && upperWick <= body * 0.5;
        const isDoji = range > 0 && body <= config.doji_body_ratio * range;
        const greenCandle = currentCandle.close > currentCandle.open;
        const redCandle = currentCandle.close < currentCandle.open;

        // --- Entry/Exit Mode Checks ---
        let buyOk = false;
        if (config.buy_mode === "Default") buyOk = true;
        if (config.buy_mode === "Hammer") buyOk = isHammer;
        if (config.buy_mode === "Green Close") buyOk = greenCandle;
        if (config.buy_mode === "Hammer + Green") buyOk = isHammer && greenCandle;
        
        let sellOk = false;
        if (config.sell_mode === "Default") sellOk = true;
        if (config.sell_mode === "Red Close") sellOk = redCandle;
        if (config.sell_mode === "Doji") sellOk = isDoji;
        if (config.sell_mode === "Doji + Red Close") sellOk = isDoji && redCandle;
        
        // --- State Machine Logic ---
        let slTriggered = false;
        if (config.sl_mode === "Signal Candle Low" && direction === "buy" && slLevel) {
            const priceToCheck = config.intrabarSL ? currentCandle.low : currentCandle.close;
            if (priceToCheck <= slLevel) {
                slTriggered = true;
            }
        }
        
        if (slTriggered) {
            direction = "sell"; // Using sell as a generic "exit" state
            slLevel = null;
            if (i === klines.length - 1) { // Only store signal if it happens on the very last candle
                newSignal = { type: 'SL_HIT', price: currentCandle.close, candle: currentCandle };
            }
        } else {
            // Check for BUY signal
            if (direction !== "buy" && nearLow && buyOk) {
                direction = "buy";
                if (config.sl_mode === "Signal Candle Low") {
                    slLevel = currentCandle.low * (1 - config.sl_buffer_pct / 100);
                }
                if (i === klines.length - 1) {
                    newSignal = { type: 'BUY', price: currentCandle.close, candle: currentCandle, buyCondition: config.buy_mode };
                }
            }
            // Check for SELL (exit) signal
            else if (direction === "buy") {
                const exitCondition = isHigh && sellOk;
                if (exitCondition) {
                    direction = "sell";
                    slLevel = null;
                    if (i === klines.length - 1) {
                        newSignal = { type: 'SELL', price: currentCandle.close, candle: currentCandle, sellCondition: config.sell_mode };
                    }
                }
            }
        }
    }
    return newSignal;
};

// =================================================================================================
// --- MAIN EXECUTION ---
// =================================================================================================

const processSymbolTimeframePair = async (symbol, timeframe, alertStates, now) => {
    try {
        console.log(`Processing ${symbol} on ${timeframe}...`);
        const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=${CONFIG.KLINE_FETCH_LIMIT}`).then(res => res.json());
        if (!Array.isArray(klinesRaw)) {
            console.error(`Invalid kline data for ${symbol} on ${timeframe}:`, klinesRaw);
            return;
        }

        const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]) }));

        if (klines.length < CONFIG.ALGO_SETTINGS.dist + 1) {
            console.log(`Skipping ${symbol} on ${timeframe} due to insufficient kline data (${klines.length}).`);
            return;
        }
        
        const signal = calculateAlgoSignals(klines, CONFIG.ALGO_SETTINGS);
        
        if (signal) {
            const uniqueId = `${symbol}-${timeframe}-${signal.type}-${signal.candle.time}`;
            if (!alertStates[uniqueId]) {
                console.log(`[NEW SIGNAL FOUND] ${uniqueId}`);
                await sendDiscordWebhook({ type: signal.type, symbol, timeframe, signal });
                alertStates[uniqueId] = now;
            } else {
                console.log(`[DUPLICATE SIGNAL] ${uniqueId} has already been sent.`);
            }
        }
    } catch (error) {
        console.error(`Error processing ${symbol} on ${timeframe}:`, error.message);
    }
};

const main = async () => {
    console.log("Starting Ay4nbolic Algo alert check script...");
    if (!CONFIG.SECRETS.DISCORD_WEBHOOK_URL || !CONFIG.SECRETS.DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks')) {
        console.error("DISCORD_WEBHOOK_URL is missing or invalid! Halting.");
        return;
    }
    if (!CONFIG.SECRETS.JSONBIN_API_KEY || !CONFIG.SECRETS.JSONBIN_BIN_ID) {
        console.error("JSONBIN credentials not set! State will not be saved. Halting.");
        return;
    }

    const alertStates = await loadState();
    const now = Date.now();
    
    for (const symbol of CONFIG.SYMBOLS) {
        for (const timeframe of CONFIG.TIMEFRAMES) {
            console.log(`--------------------------------\nChecking ${symbol} on ${timeframe}`);
            await processSymbolTimeframePair(symbol, timeframe, alertStates, now);
            console.log(`Pausing for ${CONFIG.REQUEST_DELAY_MS}ms...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY_MS));
        }
    }
 
    await saveState(alertStates);
    console.log("--------------------------------\nAll checks complete.");
};

main();
