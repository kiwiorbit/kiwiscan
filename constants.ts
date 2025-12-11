import type { Timeframe, Settings, Narrative } from './types';

const RAW_SYMBOLS: string[] = [
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
    "BLURUSDT", "NEOUSDT", "RSRUSDT", "SANDUSDT", "BANKUSDT", "DYMUSDT",
    "YGGUSDT", "TRBUSDT", "MANAUSDT", "BATUSDT", "FIDAUSDT", "XAIUSDT",
    "VANRYUSDT", "EGLDUSDT", "PHAUSDT", "SNXUSDT", "IOTXUSDT", 
    "DEXEUSDT", "MORPHOUSDT", "TNSRUSDT", "METUSDT", "ALLOUSDT", "PARTIUSDT",
    'ENSOUSDT', 'PUMPUSDT', 'LINKUSDT', 'ZENUSDT', 'WLDUSDT', 'LTCUSDT', 'DEGOUSDT', 'FORMUSDT',
    'PENGUUSDT', 'WLFIUSDT',  'TURTLEUSDT', 'ZBTUSDT', 'EULUSDT', 'DIAUSDT',
    'POLUSDT', 'SOPHUSDT', 'MLNUSDT', 'ARUSDT', 'PROVEUSDT',  'SYRUPUSDT', 'ARKMUSDT',
    'CFXUSDT', 'ACTUSDT', '0GUSDT', 'APEUSDT', 'ALICEUSDT', 'TWTUSDT', 'OPENUSDT',
    'RAYUSDT', 'ORDIUSDT',  'WUSDT', 'COOKIEUSDT', 'SPKUSDT', 'IMXUSDT', 'AUSDT',
    'ALGOUSDT', 'TUTUSDT', 'SIGNUSDT', 'SOLVUSDT','FUNUSDT', 'SHELLUSDT',
    'GRTUSDT',  'SAGAUSDT', 'UMAUSDT', 'HOOKUSDT', 'PORTALUSDT', 'LISTAUSDT', 'SSVUSDT',
    'HOMEUSDT', 'ANIMEUSDT', 'KAIAUSDT', 'AXSUSDT', 'MINAUSDT', 'ROSEUSDT', 'GUNUSDT', 'GPSUSDT',
    'SCRTUSDT', 'TSTUSDT', 'NMRUSDT', 'PHBUSDT', 'INITUSDT', 'HFTUSDT', 'ACEUSDT', 'FISUSDT',
    'RAREUSDT', 'USUALUSDT', 'MAGICUSDT', 'BARDUSDT','KSMUSDT', 'MANTAUSDT',
    'FORTHUSDT', 'COWUSDT', 'ALTUSDT', 'LUMIAUSDT', 'REDUSDT', 'CKBUSDT', 'RONINUSDT', 'RPLUSDT', 
    'AVAUSDT', 'USTCUSDT', 'STGUSDT', 'BABYUSDT', 'MASKUSDT', 'GHSTUSDT', 'SLPUSDT', 'NEWTUSDT', 
    'SXTUSDT', 'ONEUSDT', 'COTIUSDT', 'AWEUSDT', 'ACXUSDT', 'LUNAUSDT', 
    'ARPAUSDT', 'ASRUSDT', 'ZILUSDT', 'ANKRUSDT', 'A2ZUSDT', 'MBOXUSDT', 
    'SPELLUSDT', 'SCRUSDT', 'TLMUSDT', 'LAYERUSDT', 'MOVRUSDT', 'HMSTRUSDT', 'RDNTUSDT', 
    'AUDIOUSDT', 'SYNUSDT', 'HIGHUSDT', 'ONTUSDT', 'KNCUSDT', 'ASTRUSDT', 
    'HIVEUSDT','OXTUSDT', 'ICPUSDT',
    'QNTUSDT', 'RNDRUSDT', 'FLOWUSDT', 'KAVAUSDT', 'CELOUSDT', 'YFIUSDT', 
    'RUNEUSDT', 'GTCUSDT', 'OCEANUSDT', 'CVCUSDT', 'BANDUSDT', 'LPTUSDT', 'RLCUSDT', 
    'NULSUSDT', 'DODOUSDT', 'BELUSDT', 'BAKEUSDT', 'ATAUSDT', 'DENTUSDT', 'NKNUSDT', 'DGBUSDT', 
    'RENUSDT', 'STMXUSDT', 'SYSUSDT', 'KDAUSDT', 'OGNUSDT'
];


// Exporting a unique, default list of symbols. This is the fallback.
export const DEFAULT_SYMBOLS: string[] = [...new Set(RAW_SYMBOLS)];

const SECONDARY_RAW_SYMBOLS: string[] = [
    'ENSOUSDT'
];
export const SECONDARY_SYMBOLS: string[] = [...new Set(SECONDARY_RAW_SYMBOLS)];

const TERTIARY_RAW_SYMBOLS: string[] = [
    'FORTHUSDT'
];
export const TERTIARY_SYMBOLS: string[] = [...new Set(TERTIARY_RAW_SYMBOLS)];

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: '3m', label: '3m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '2h', label: '2h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
    { value: '3d', label: '3d' },
    { value: '1w', label: '1w' },
];

export const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
    { key: 'change24h', label: 'Chg% (24h)' },
    { key: 'change15m', label: 'Chg% (15m)' },
    { key: 'kt-3m', label: 'KT - 3m' },
    { key: 'kt-5m', label: 'KT - 5m' },
    { key: 'kt-15m', label: 'KT - 15m' },
    { key: 'kt-1h', label: 'KT - 1h' },
    { key: 'kt-4h', label: 'KT - 4h' },
    { key: 'hl-5m', label: 'HL - 5m' }, // NEW
    { key: 'hl-15m', label: 'HL - 15m' }, // NEW
    { key: 'hl-30m', label: 'HL - 30m' }, // NEW
    { key: 'hl-1h', label: 'HL - 1h' }, // NEW
    { key: 'dailyVwap', label: 'VWAP' },
    { key: 'ticks5m', label: 'Ticks 5m' },
    { key: 'spotVolume1h', label: 'Spot Vol (1h)' },
    { key: 'delta15m', label: 'V.Delta 15m' },
    { key: 'delta1h', label: 'V.Delta 1h' },
    { key: 'cvd15m', label: 'CVD 15m' },
    { key: 'cvd1h', label: 'CVD 1h' },
    { key: 'oiChange4h', label: 'OI Δ (4h)' },
    { key: 'oiChange8h', label: 'OI Δ (8h)' },
    { key: 'fundingRate', label: 'FR' },
    { key: 'vsBtc1h', label: 'vs BTC (1h)' },
    { key: 'rsi4h', label: 'RSI (4h)' },
];

export const DARK_THEME_SETTINGS: Settings = {
    bgColor: '#181c24',
    textColor: '#e5e9f2',
    cellBgColor: '#232a36',
    rsiColor: '#29ffb8',
    smaColor: '#4ec3fa',
    rsi50Color: '#4a5568',
    lineWidth: 2,
    stochKColor: '#29ffb8',
    stochDColor: '#4ec3fa',
    enableLiveAnimations: true,
    candlesDisplayed: 120,
    trailingStopSettings: {
        distributionLength: 10,
        dataLength: 1,
        useHeikinAshiForTrail: true,
    },
    // NEW: High/Low Algo default settings
    highLowAlgoSettings: {
        dist: 30,
        buy_threshold_pct: 0.5,
        sell_threshold_pct: 0.3,
        buy_mode: "Green Close",
        sell_mode: "Red Close",
        hammer_wick_ratio: 1.0,
        doji_body_ratio: 0.5,
        sl_mode: "Signal Candle Low",
        sl_buffer_pct: 0.5,
        intrabarSL: true,
    },
    alertConditions: {
        kiwiBullishFlip: true,
        kiwiBearishFlip: true,
        supertrendBuy: false,
        supertrendSell: false,
    },
    sendDiscordNotifications: false,
    selectedAssetList: 'MASTER',
    visibleColumns: TOGGLEABLE_COLUMNS.reduce((acc, col) => {
        acc[col.key] = true;
        return acc;
    }, {} as { [key: string]: boolean }),
    chartViewMode: 'modal',
};

export interface RsiColorInfo {
    bgColor: string;
    textColor: string;
    isExtreme: boolean;
}

export const getRsiColorInfo = (rsi: number | undefined): RsiColorInfo => {
    if (rsi === undefined || rsi === null) return { bgColor: 'bg-gray-700/50', textColor: 'text-gray-400', isExtreme: false };

    const whiteText = 'text-white/95';

    // Extreme Oversold & Oversold
    if (rsi < 20) return { bgColor: 'bg-green-900/10', textColor: whiteText, isExtreme: true };
    if (rsi < 30) return { bgColor: 'bg-green-700/10', textColor: whiteText, isExtreme: false };
    if (rsi < 45) return { bgColor: 'bg-green-600/10', textColor: whiteText, isExtreme: false };

    // Mid-range
    if (rsi < 50) return { bgColor: 'bg-teal-700/10', textColor: whiteText, isExtreme: false };
    if (rsi < 51) return { bgColor: 'bg-purple-700/10', textColor: whiteText, isExtreme: false };
    if (rsi < 55) return { bgColor: 'bg-yellow-700/10', textColor: whiteText, isExtreme: true };

    // Overbought
    if (rsi < 65) return { bgColor: 'bg-amber-600/10', textColor: whiteText, isExtreme: false };
    if (rsi < 75) return { bgColor: 'bg-rose-600/10', textColor: whiteText, isExtreme: false };
    if (rsi <= 80) return { bgColor: 'bg-rose-700/10', textColor: whiteText, isExtreme: false };

    // Extreme Overbought (rsi > 80)
    return { bgColor: 'bg-rose-900/10', textColor: whiteText, isExtreme: true };
};


// New helper for Relative Strength coloring
export const getStrengthColor = (strength: number | undefined): string => {
    if (strength === undefined) return '#374151'; // gray-700

    if (strength > 10) return '#059669'; // emerald-700
    if (strength > 5) return '#059669'; // emerald-600
    if (strength > 1) return '#059669'; // emerald-500
    if (strength > -1) return '#BE8400'; // emerald-400
    
    if (strength > -5) return '#9f1239'; // red-500
    if (strength > -10) return '#9f1239'; // red-600
    return '#9f1239'; // red-700
};
