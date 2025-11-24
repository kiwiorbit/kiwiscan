// A self-contained Node.js script to check for Statistical Trailing Stop alerts and send them to Discord.
// This runs in a cloud environment (like Render Cron Jobs), independent of the browser app.

import https from 'https';

// --- CONFIGURATION ---
// Symbols to be checked on both 1h and 4h timeframes.
const COMMON_SYMBOLS = [
  "ETHUSDT", "SOLUSDT", "BNBUSDT", "AVAXUSDT", "SUIUSDT", "ARBUSDT", 
  "VIRTUALUSDT", "NEARUSDT", "PENDLEUSDT", "BIOUSDT", "JUPUSDT", 
  "SUSHIUSDT", "CTSIUSDT", "CHRUSDT", "EDUUSDT", "GASUSDT", 
  "BICOUSDT", "HEMIUSDT", "CAKEUSDT", "ZKCUSDT", "DASHUSDT", "XPLUSDT"
];

// Symbols to be checked only on the 1-hour timeframe.
const H1_ONLY_SYMBOLS = [
  "ADAUSDT", "ATOMUSDT", "XRPUSDT", "DOGEUSDT", "FILUSDT", "TRXUSDT", 
  "HBARUSDT", "FETUSDT", "AIXBTUSDT", "ENSUSDT", "VETUSDT", 
  "STRKUSDT", "STXUSDT", "ZROUSDT", "MOVEUSDT", "JTOUSDT", 
  "IOTAUSDT", "THETAUSDT", "SUPERUSDT", "ZECUSDT", "OGUSDT", 
  "TOWNSUSDT", "CUSDT", "RESOLVUSDT", "SFPUSDT", "API3USDT", 
  "BEAMXUSDT", "RENDERUSDT", "BERAUSDT", "KAITOUSDT"
];

// Symbols to be checked only on the 4-hour timeframe.
const H4_ONLY_SYMBOLS = [
  "PYTHUSDT", "XLMUSDT", "BCHUSDT", "ETCUSDT", "SEIUSDT", 
  "DOTUSDT", "UNIUSDT", "TAOUSDT", "LDOUSDT", "GALAUSDT", 
  "BLURUSDT", "NEOUSDT", "RSRUSDT", "SANDUSDT", 
  "YGGUSDT", "TRBUSDT", "MANAUSDT", "BATUSDT", "FIDAUSDT", 
  "VANRYUSDT", "EGLDUSDT", "PHAUSDT", "SNXUSDT", "IOTXUSDT", 
  "DEXEUSDT", "MORPHOUSDT"
];

// Symbols to be checked on the 15-minute timeframe ONLY IF they are trading above their daily VWAP.
const M15_VWAP_SYMBOLS = [...new Set([
    "BTCUSDT","ETHUSDT", "SOLUSDT", "BNBUSDT", "AVAXUSDT", "SUIUSDT", "ARBUSDT", 
    "VIRTUALUSDT", "NEARUSDT", "PENDLEUSDT", "BIOUSDT", "JUPUSDT", 'PAXGUSDT',
    "SUSHIUSDT", "CTSIUSDT", "CHRUSDT", "EDUUSDT", "GASUSDT", 
    "BICOUSDT", "HEMIUSDT", "CAKEUSDT", "ZKCUSDT", "DASHUSDT", "XPLUSDT",
    "ADAUSDT", "ATOMUSDT", "XRPUSDT", "DOGEUSDT", "FILUSDT", "TRXUSDT", 
    "HBARUSDT", "FETUSDT", "AIXBTUSDT", "ENSUSDT", "VETUSDT", 
    "STRKUSDT", "STXUSDT", "ZROUSDT", "MOVEUSDT", "JTOUSDT", 
    "IOTAUSDT", "THETAUSDT", "SUPERUSDT", "ZECUSDT", "OGUSDT", 
    "TOWNSUSDT", "CUSDT", "RESOLVUSDT", "SFPUSDT", "API3USDT", 
    "BEAMXUSDT", "RENDERUSDT", "BERAUSDT", "KAITOUSDT",
    "PYTHUSDT", "XLMUSDT", "BCHUSDT", "ETCUSDT", "SEIUSDT", 
    "DOTUSDT", "UNIUSDT", "TAOUSDT", "LDOUSDT", "GALAUSDT", 
    "BLURUSDT", "NEOUSDT", "RSRUSDT", "SANDUSDT", 
    "YGGUSDT", "TRBUSDT", "MANAUSDT", "BATUSDT", "FIDAUSDT", 
    "VANRYUSDT", "EGLDUSDT", "PHAUSDT", "SNXUSDT", "IOTXUSDT", 
    "DEXEUSDT", "MORPHOUSDT", "TNSRUSDT",
    'ENSOUSDT', 'PUMPUSDT', 'LINKUSDT', 'ZENUSDT', 'WLDUSDT', 'LTCUSDT', 'DEGOUSDT', 'FORMUSDT',
    'PENGUUSDT', 'WLFIUSDT',  'TURTLEUSDT', 'ZBTUSDT', 'EULUSDT', 'DIAUSDT',
    'POLUSDT', 'SOPHUSDT', 'MLNUSDT', 'ARUSDT', 'PROVEUSDT',  'SYRUPUSDT', 'ARKMUSDT',
    'CFXUSDT', 'ACTUSDT', '0GUSDT', 'APEUSDT', 'ALICEUSDT', 'TWTUSDT', 'OPENUSDT',
    'RAYUSDT', 'ORDIUSDT',  'WUSDT', 'COOKIEUSDT', 'SPKUSDT', 'IMXUSDT', 'AUSDT',
    'ALGOUSDT', 'TUTUSDT', 'SIGNUSDT', 'SOLVUSDT','FUNUSDT', 'SHELLUSDT',
    'GRTUSDT',  'SAGAUSDT', 'UMAUSDT', 'HOOKUSDT', 'PORTALUSDT', 'LISTAUSDT', 'SSVUSDT',
    'HOMEUSDT', 'ANIMEUSDT', 'KAIAUSDT', 'AXSUSDT', 'MINAUSDT', 'ROSEUSDT', 'GUNUSDT', 'GPSUSDT',
    'SCRTUSDT', 'TSTUSDT', 'NMRUSDT', 'PHBUSDT', 'INITUSDT', 'HFTUSDT', 'ACEUSDT', 'FISUSDT', 'MBLUSDT',
    'RAREUSDT', 'USUALUSDT', 'MAGICUSDT', 'BARDUSDT','KSMUSDT', 'MANTAUSDT',
    'FORTHUSDT', 'COWUSDT', 'ALTUSDT', 'LUMIAUSDT', 'REDUSDT', 'CKBUSDT', 'RONINUSDT', 'RPLUSDT', 
    'AVAUSDT', 'USTCUSDT', 'STGUSDT', 'BABYUSDT', 'MASKUSDT', 'GHSTUSDT', 'SLPUSDT', 'NEWTUSDT', 
    'SXTUSDT', 'ONEUSDT', 'COTIUSDT', 'AWEUSDT', 'ACXUSDT', 'HAEDALUSDT', 'LUNAUSDT', 'ORCAUSDT', 
    'VELODROMEUSDT', 'ARPAUSDT', 'ASRUSDT', 'ZILUSDT', 'ANKRUSDT', 'A2ZUSDT', 'MBOXUSDT', 
    'SPELLUSDT', 'SCRUSDT', 'TLMUSDT', 'LAYERUSDT', 'MOVRUSDT', 'HMSTRUSDT', 'RDNTUSDT', 
    'AUDIOUSDT', 'SYNUSDT', 'HIGHUSDT', 'ONTUSDT', 'KNCUSDT', 'ASTRUSDT', 
    'HIVEUSDT','OXTUSDT', 'ICPUSDT',  'EOSUSDT', 
    'QNTUSDT', 'RNDRUSDT', 'FLOWUSDT', 'KAVAUSDT', 'CELOUSDT', 'YFIUSDT', 
    'RUNEUSDT', 'GTCUSDT', 'OCEANUSDT', 'CVCUSDT', 'BANDUSDT', 'LPTUSDT', 'RLCUSDT', 
    'NULSUSDT', 'DODOUSDT', 'BELUSDT', 'BAKEUSDT', 'ATAUSDT', 'DENTUSDT', 'NKNUSDT', 'DGBUSDT', 
    'RENUSDT', 'STMXUSDT', 'SYSUSDT', 'KDAUSDT', 'OGNUSDT'
])];


const { DISCORD_WEBHOOK_URL, JSONBIN_API_KEY, JSONBIN_BIN_ID } = process.env;

// --- Simple Fetch Implementation for Node.js ---
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
                resolve({ json: () => JSON.parse(data), ok: true, text: () => data });
            } catch (e) {
                resolve({ text: () => data, ok: true });
            }
        });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
});

// --- Formatting Helpers ---
const formatUsdValue = (volume) => {
    const absVolume = Math.abs(volume);
    const sign = volume < 0 ? '-' : '+';
    if (absVolume >= 1e6) return `${sign}${(absVolume / 1e6).toFixed(1)}M`;
    if (absVolume >= 1e3) return `${sign}${(absVolume / 1e3).toFixed(1)}K`;
    return `${sign}$${absVolume.toFixed(0)}`;
};
const formatPercent = (percent) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;


// --- State Management using JSONBin.io ---
const loadState = async () => {
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

// --- Discord Webhook Sender ---
const sendDiscordWebhook = (notification) => {
    console.log(`[!] ATTEMPTING TO SEND DISCORD NOTIFICATION for ${notification.symbol}`);
    const { type, symbol, timeframe, price, context } = notification;

    const colorMap = {
        'luxalgo-bullish-flip': 3066993,      // Green
        'luxalgo-bearish-flip': 15158332,     // Red
    };

    const timeframeMap = { '1h': '60', '4h': '240', '15m': '15' };
    const tradingViewInterval = timeframeMap[timeframe] || '';
    const tradingViewURL = `https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol.replace('.P', '')}&interval=${tradingViewInterval}`;

    const isBuy = type === 'luxalgo-bullish-flip';
    
    let priceLine = `Price : $${price.toFixed(4)}`;
    if (context.priceChangePercent24h != null) {
        const changeSign = context.priceChangePercent24h >= 0 ? '+' : '';
        priceLine += ` (${changeSign}${context.priceChangePercent24h.toFixed(2)}%)`;
    }

    const descriptionLines = [
        `Kiwitrail Bot ${isBuy ? 'Buys' : 'Sells'} on (${timeframe})`,
        `Bias flipped to ${isBuy ? 'Bullish' : 'Bearish'}`,
        priceLine,
        ``,
        `[View Chart](${tradingViewURL})`,
        
    ];

    const embed = {
        title: symbol,
        description: descriptionLines.join('\n'),
        color: colorMap[type] || 10070709,
        fields: [],
        timestamp: new Date().toISOString()
    };
    
    // Add Net Volume Field
    if (context.netVol) {
        const volLines = [
            `\`(15m) : ${formatUsdValue(context.netVol.netVol15m).padStart(8)}\``,
            `\`(1h)  : ${formatUsdValue(context.netVol.netVol1h).padStart(8)}\``,
            `\`(4h)  : ${formatUsdValue(context.netVol.netVol4h).padStart(8)}\``,
        ].join('\n');
        embed.fields.push({ name: 'Net vol :', value: volLines, inline: true });
    }

    // Add OI Field
    if (context.oi) {
        const oiLines = [
            `\`(1h) : ${formatPercent(context.oi.oiChange1h).padStart(8)}\``,
            `\`(4h) : ${formatPercent(context.oi.oiChange4h).padStart(8)}\``,
            `\`(8h) : ${formatPercent(context.oi.oiChange8h).padStart(8)}\``,
        ].join('\n');
        embed.fields.push({ name: 'Oi % :', value: oiLines, inline: true });
    }

    // Add Spacer
    if (embed.fields.length > 0) {
        embed.fields.push({ name: '\u200B', value: '\u200B', inline: false });
    }

    // Add VWAP Field
    if (context.dailyVwap) {
        const vwapStatus = price > context.dailyVwap ? '🔼 Above' : '🔽 Below';
        const vwapValue = `\`$${context.dailyVwap.toFixed(4)}\`\n**${vwapStatus}**`;
        embed.fields.push({ name: 'Daily VWAP', value: vwapValue, inline: true });
    }
    
    // Add RSI Field
    if (context.rsi4h) {
        embed.fields.push({ name: 'RSI (4h)', value: `\`${context.rsi4h.toFixed(2)}\``, inline: true });
    }
    
    // Add vs BTC Field
    if (context.vsBtc1h) {
        embed.fields.push({ name: 'vs BTC (1h)', value: `\`${formatPercent(context.vsBtc1h)}\``, inline: true });
    }


    const payload = JSON.stringify({ embeds: [embed] });

    console.log('[DEBUG] Payload being sent to Discord:', payload);
    return fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    }).catch(e => console.error(`Error sending webhook: ${e.message}`));
};


// --- INDICATOR CALCULATION LOGIC ---
const sma = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength === 0) return 0;
    const series = source.slice(-useLength);
    const sum = series.reduce((a, b) => a + b, 0);
    return sum / useLength;
};

const stdev = (source, length) => {
    const useLength = Math.min(source.length, length);
    if (useLength < 1) return 0;
    const series = source.slice(-useLength);
    const mean = sma(series, useLength);
    if (isNaN(mean)) return 0;
    const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / useLength;
    return Math.sqrt(variance);
};

const calculateRSI = (closes, length = 14) => {
    if (closes.length <= length) return null;
    let gains = [];
    let losses = [];
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(Math.max(0, change));
        losses.push(Math.max(0, -change));
    }
    let avgGain = gains.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
    let avgLoss = losses.slice(0, length).reduce((sum, val) => sum + val, 0) / length;
    let rsi;
    for (let i = length; i < gains.length; i++) {
        avgGain = (avgGain * (length - 1) + gains[i]) / length;
        avgLoss = (avgLoss * (length - 1) + losses[i]) / length;
    }
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    return rsi;
};

const calculateVWAP = (klines) => {
    if (!klines || klines.length === 0) return 0;
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    for (const kline of klines) {
        const typicalPrice = (kline.high + kline.low + kline.close) / 3;
        cumulativeTPV += typicalPrice * kline.volume;
        cumulativeVolume += kline.volume;
    }
    return cumulativeVolume === 0 ? 0 : cumulativeTPV / cumulativeVolume;
};

const calculateDailyVWAPForSymbol = async (symbol) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startTime = today.getTime();
    try {
        const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=5m&startTime=${startTime}&limit=1500`).then(res => res.json());
        if (!Array.isArray(klinesRaw) || klinesRaw.length === 0) return null;
        const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]) }));
        return calculateVWAP(klines);
    } catch (e) {
        console.warn(`Could not calculate daily VWAP for ${symbol}: ${e.message}`);
        return null;
    }
};

const calculateHeikinAshi = (klines) => {
    if (klines.length === 0) return [];
    const haKlines = [];
    for (let i = 0; i < klines.length; i++) {
        const p = klines[i];
        const haClose = (p.open + p.high + p.low + p.close) / 4;
        let haOpen;
        if (i === 0) {
            haOpen = (p.open + p.close) / 2;
        } else {
            const prevHa = haKlines[i - 1];
            haOpen = (prevHa.open + prevHa.close) / 2;
        }
        const haHigh = Math.max(p.high, haOpen, haClose);
        const haLow = Math.min(p.low, haOpen, haClose);
        haKlines.push({ ...p, open: haOpen, high: haHigh, low: haLow, close: haClose });
    }
    return haKlines;
};

const calculateStatisticalTrailingStop = (klines, dataLength = 1, distributionLength = 10) => {
    const requiredBars = distributionLength + dataLength + 2;
    if (klines.length < requiredBars) return [];

    const logTrueRanges = [];
    for (let i = 0; i < klines.length; i++) {
        const requiredHistory = dataLength + 1;
        if (i < requiredHistory) { logTrueRanges.push(null); continue; }
        const highSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.high);
        const lowSeries = klines.slice(i - dataLength + 1, i + 1).map(k => k.low);
        const h = Math.max(...highSeries);
        const l = Math.min(...lowSeries);
        const closePrev = klines[i - requiredHistory].close;
        const tr = Math.max(h - l, Math.abs(h - closePrev), Math.abs(l - closePrev));
        logTrueRanges.push(tr > 0 ? Math.log(tr) : null);
    }
    
    const results = [];
    let currentTrail = null;

    for (let i = 0; i < klines.length; i++) {
        const kline = klines[i];
        if (i < distributionLength - 1) { results.push({ time: kline.time, bias: 0, level: 0 }); continue; }
        const logTrWindow = logTrueRanges.slice(i - distributionLength + 1, i + 1).filter(v => v !== null);
        let delta;
        if (logTrWindow.length > 1) {
            const avg = sma(logTrWindow, distributionLength);
            const std = stdev(logTrWindow, distributionLength);
            delta = Math.exp(avg + 1 * std);
        } else if (currentTrail) {
            delta = currentTrail.delta;
        } else {
            results.push({ time: kline.time, bias: 0, level: 0 }); continue;
        }
        
        const hlc3 = (kline.high + kline.low + kline.close) / 3;
        if (currentTrail === null) {
            currentTrail = { bias: 0, delta: delta, level: hlc3 + delta };
        }
        
        currentTrail.delta = delta;
        const trailTrigger = (currentTrail.bias === 0 && kline.close >= currentTrail.level) || (currentTrail.bias === 1 && kline.close <= currentTrail.level);
        if (trailTrigger) {
            currentTrail.bias = currentTrail.bias === 0 ? 1 : 0;
            currentTrail.level = currentTrail.bias === 0 ? hlc3 + delta : Math.max(hlc3 - delta, 0);
        } else {
            currentTrail.level = currentTrail.bias === 0 ? Math.min(currentTrail.level, hlc3 + delta) : Math.max(currentTrail.level, Math.max(hlc3 - delta, 0));
        }
        results.push({ time: kline.time, bias: currentTrail.bias, level: currentTrail.level });
    }
    return results;
};


// --- Contextual Data Fetching ---
const getNetVolumeForPeriod = async (symbol, lookbackMinutes) => {
    try {
        const limit = Math.min(Math.ceil(lookbackMinutes / 5), 1500);
        const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=5m&limit=${limit}`).then(res => res.json());
        return klinesRaw.reduce((sum, k) => {
            const quoteVol = parseFloat(k[7]);
            const takerBuyQuoteVol = parseFloat(k[10]);
            return sum + (takerBuyQuoteVol - (quoteVol - takerBuyQuoteVol));
        }, 0);
    } catch (e) { return 0; }
};

const getOiChangeForPeriod = async (symbol, lookbackHours) => {
    try {
        const limit = Math.min(lookbackHours, 500);
        const oiRaw = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=${limit}`).then(res => res.json());
        if (oiRaw.length < limit) return 0;
        const startOi = parseFloat(oiRaw[0].sumOpenInterest);
        const endOi = parseFloat(oiRaw[oiRaw.length - 1].sumOpenInterest);
        return startOi > 0 ? ((endOi - startOi) / startOi) * 100 : 0;
    } catch (e) { return 0; }
};

const getContextualData = async (symbol) => {
    // --- Existing Fetches ---
    const netVolPromise = Promise.all([
        getNetVolumeForPeriod(symbol, 15),
        getNetVolumeForPeriod(symbol, 60),
        getNetVolumeForPeriod(symbol, 240)
    ]).then(([netVol15m, netVol1h, netVol4h]) => ({ netVol15m, netVol1h, netVol4h }));

    const oiPromise = Promise.all([
        getOiChangeForPeriod(symbol, 1),
        getOiChangeForPeriod(symbol, 4),
        getOiChangeForPeriod(symbol, 8)
    ]).then(([oiChange1h, oiChange4h, oiChange8h]) => ({ oiChange1h, oiChange4h, oiChange8h }));
    
    // --- New Data Fetches for Enrichment ---
    const rsiPromise = fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=4h&limit=100`).then(res => res.json()).then(klines => {
        const closes = klines.map(k => parseFloat(k[4]));
        return calculateRSI(closes, 14);
    }).catch(() => null);

    const vwapPromise = calculateDailyVWAPForSymbol(symbol);

    const vsBtcPromise = (async () => {
        try {
            const [symbolKlines, btcKlines] = await Promise.all([
                fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=2`).then(res => res.json()),
                fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=2`).then(res => res.json())
            ]);
            const calcChg = (klines) => klines && klines.length > 1 ? ((parseFloat(klines[1][4]) - parseFloat(klines[0][4])) / parseFloat(klines[0][4])) * 100 : 0;
            return calcChg(symbolKlines) - calcChg(btcKlines);
        } catch (e) { return null; }
    })();

    const tickerPromise = fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`)
        .then(res => res.json())
        .catch(() => null);

    const [netVol, oi, rsi4h, dailyVwap, vsBtc1h, ticker24h] = await Promise.all([netVolPromise, oiPromise, rsiPromise, vwapPromise, vsBtcPromise, tickerPromise]);
    
    return { netVol, oi, rsi4h, dailyVwap, vsBtc1h, priceChangePercent24h: ticker24h ? parseFloat(ticker24h.priceChangePercent) : null };
};


// --- Main Alert Checking Logic ---
const checkAlerts = async (symbol, timeframe, data, states, now) => {
    const alerts = [];
    const canFire = (uniqueId) => {
        const hasFired = states[uniqueId];
        if (hasFired) {
            console.log(`[DUPLICATE] Alert for ${uniqueId} has already been fired.`);
        }
        return !hasFired;
    };
    const addAlert = (uniqueId, type, price, context) => {
        console.log(`[ALERT PREPARED] ${symbol} ${type} on ${timeframe}`);
        alerts.push({ type, symbol, timeframe, price, context });
        states[uniqueId] = now;
    };

    const lastKline = data.klines[data.klines.length - 1];

    // --- TRAILING STOP ALERTS ---
    const isLuxAlgoEnabled = process.env.ALERT_LUXALGO_FLIP_ENABLED === 'true';
    if (isLuxAlgoEnabled && data.luxalgoTrail && data.luxalgoTrail.length >= 2) {
        const lastTrail = data.luxalgoTrail[data.luxalgoTrail.length - 1];
        const prevTrail = data.luxalgoTrail[data.luxalgoTrail.length - 2];
        const BULLISH = 1;
        const BEARISH = 0;

        if (prevTrail.bias === BEARISH && lastTrail.bias === BULLISH) {
            const uniqueId = `${symbol}-${timeframe}-luxalgo-bullish-flip-${lastTrail.time}`;
            if (canFire(uniqueId)) {
                const context = await getContextualData(symbol);
                addAlert(uniqueId, 'luxalgo-bullish-flip', lastKline.close, context);
            }
        }

        if (prevTrail.bias === BULLISH && lastTrail.bias === BEARISH) {
             const uniqueId = `${symbol}-${timeframe}-luxalgo-bearish-flip-${lastTrail.time}`;
            if (canFire(uniqueId)) {
                const context = await getContextualData(symbol);
                addAlert(uniqueId, 'luxalgo-bearish-flip', lastKline.close, context);
            }
        }
    }

    return alerts;
};

// --- Execution Helper ---
const processSymbolTimeframePair = async (symbol, timeframe, alertStates, now) => {
    try {
        console.log(`Processing ${symbol} on ${timeframe}...`);
        const klinesRaw = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=300`).then(res => res.json());
        const klines = klinesRaw.map(k => ({ time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), quoteVolume: parseFloat(k[7]), takerBuyQuoteVolume: parseFloat(k[10]) }));

        if (klines.length < 101) {
            console.log(`Skipping ${symbol} on ${timeframe} due to insufficient kline data (${klines.length}).`);
            return;
        }

        // --- NEW: Heikin Ashi Smoothing ---
        const useHeikinAshi = process.env.USE_HEIKIN_ASHI === 'true';
        let klinesForTrail = klines;
        if (useHeikinAshi) {
            console.log(`Applying Heikin Ashi smoothing for ${symbol} on ${timeframe}...`);
            klinesForTrail = calculateHeikinAshi(klines);
        }
        
        const data = {
            klines, // Original klines for price data
            luxalgoTrail: calculateStatisticalTrailingStop(klinesForTrail), // Smoothed klines for calculation
        };
        
        const firedAlerts = await checkAlerts(symbol, timeframe, data, alertStates, now);
        for (const alert of firedAlerts) {
            await sendDiscordWebhook(alert);
        }
    } catch (error) {
        console.error(`Error processing ${symbol} on ${timeframe}:`, error.message);
    }
};


// --- Main Execution ---
const main = async () => {
    console.log("Starting Trailing Stop alert check script...");
    if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks')) {
        console.error("DISCORD_WEBHOOK_URL is missing or invalid! Halting.");
        return;
    }
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
        console.error("JSONBIN_API_KEY or JSONBIN_BIN_ID is not set! Halting.");
        return;
    }

    const alertStates = await loadState();
    const now = Date.now();
    
    // Process Common symbols
    for (const symbol of COMMON_SYMBOLS) {
        console.log(`--------------------------------\nProcessing Common Symbol: ${symbol}`);
        await processSymbolTimeframePair(symbol, '1h', alertStates, now);
        await processSymbolTimeframePair(symbol, '4h', alertStates, now);
        console.log(`Pausing for 1 second after processing ${symbol}...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Process 1h-only symbols
    for (const symbol of H1_ONLY_SYMBOLS) {
        console.log(`--------------------------------\nProcessing 1h-Only Symbol: ${symbol}`);
        await processSymbolTimeframePair(symbol, '1h', alertStates, now);
        console.log(`Pausing for 1 second after processing ${symbol}...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    // Process 4h-only symbols
    for (const symbol of H4_ONLY_SYMBOLS) {
        console.log(`--------------------------------\nProcessing 4h-Only Symbol: ${symbol}`);
        await processSymbolTimeframePair(symbol, '4h', alertStates, now);
        console.log(`Pausing for 1 second after processing ${symbol}...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Process 15m VWAP-conditional symbols
    for (const symbol of M15_VWAP_SYMBOLS) {
        console.log(`--------------------------------\nProcessing 15m VWAP Check for: ${symbol}`);
        try {
            const [tickerRes, dailyVwap] = await Promise.all([
                fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`),
                calculateDailyVWAPForSymbol(symbol)
            ]);
            const ticker = await tickerRes.json();
            const currentPrice = parseFloat(ticker.price);

            if (dailyVwap && currentPrice > dailyVwap) {
                console.log(`[VWAP CHECK PASSED] ${symbol} is above VWAP ($${currentPrice} > $${dailyVwap}). Proceeding with 15m alert check.`);
                await processSymbolTimeframePair(symbol, '15m', alertStates, now);
            } else {
                console.log(`[VWAP CHECK SKIPPED] ${symbol} is not above VWAP ($${currentPrice} <= $${dailyVwap || 'N/A'}).`);
            }
        } catch (error) {
            console.error(`Error during VWAP check for ${symbol}:`, error.message);
        }
        console.log(`Pausing for 1 second after processing ${symbol}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
 
    await saveState(alertStates);
    console.log("--------------------------------\nAll checks complete.");
};

main();