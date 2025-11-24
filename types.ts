

export interface Kline {
    openTime: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteAssetVolume: string;
    numberOfTrades: number;
    takerBuyBaseAssetVolume: string;
    takerBuyQuoteAssetVolume:string;
    ignore: string;
}

export interface RsiDataPoint {
    time: number;
    value: number;
}

export interface PriceDataPoint {
    time: number;

    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    quoteVolume: number;
    takerBuyVolume: number;
    takerBuyQuoteVolume: number;
    numberOfTrades?: number;
}


export type OiTimeframe = '1h' | '4h' | '8h';

// === NEW: High/Low Algo Types ===
export interface HighLowAlgoSignalPoint {
    time: number;
    type: 'BUY' | 'SELL' | 'SL_HIT';
    price: number;
}

export interface SymbolData {
    rsi: RsiDataPoint[];
    sma: RsiDataPoint[];
    priceSma: RsiDataPoint[];
    priceSma50?: RsiDataPoint[];
    priceSma100?: RsiDataPoint[];
    stochK: RsiDataPoint[];
    stochD: RsiDataPoint[];
    vwap: RsiDataPoint[];
    dailyVwap?: RsiDataPoint[];
    vwapAnchoredHigh?: RsiDataPoint[];
    vwapAnchoredLow?: RsiDataPoint[];
    openInterestHistory?: { [key in OiTimeframe]?: RsiDataPoint[] };
    openInterestChange?: { [key in OiTimeframe]?: number };
    price: number;
    volume: number;
    quoteVolume: number;
    klines: PriceDataPoint[];
    volumeProfile?: VolumeProfileData;
    kiwiTrail?: { time: number; bias: number; level: number; }[];
    supertrend?: { time: number; up: number | null; dn: number | null; trend: number }[];
    cvd?: RsiDataPoint[];
    atr14?: number;
    highLowAlgoSignals?: HighLowAlgoSignalPoint[];
    highLowAlgoChannel?: { time: number; high: number; low: number; }[];
}

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '1d' | '3d' | '1w';


export interface AlertConditions {
    kiwiBullishFlip: boolean;
    kiwiBearishFlip: boolean;
    supertrendBuy: boolean;
    supertrendSell: boolean;
}

export interface TrailingStopSettings {
    distributionLength: 10 | 100;
    dataLength: 1 | 5;
    useHeikinAshiForTrail: boolean;
}

// === NEW: High/Low Algo Settings Type ===
export interface HighLowAlgoSettings {
    dist: number;
    buy_threshold_pct: number;
    sell_threshold_pct: number;
    buy_mode: "Default" | "Hammer" | "Green Close" | "Hammer + Green";
    sell_mode: "Default" | "Red Close" | "Doji" | "Doji + Red Close";
    hammer_wick_ratio: number;
    doji_body_ratio: number;
    sl_mode: "None" | "Signal Candle Low";
    sl_buffer_pct: number;
    intrabarSL: boolean;
}


export interface Settings {
    bgColor: string;
    textColor: string;
    cellBgColor: string;
    rsiColor: string;
    smaColor: string;
    rsi50Color: string;
    lineWidth: number;
    stochKColor: string;
    stochDColor: string;
    enableLiveAnimations: boolean;
    alertConditions: AlertConditions;
    sendDiscordNotifications: boolean;
    candlesDisplayed: number;
    trailingStopSettings: TrailingStopSettings;
    highLowAlgoSettings: HighLowAlgoSettings; // Added Algo settings
    selectedAssetList: 'MASTER' | 'SECONDARY' | 'TERTIARY' | 'CUSTOM';
    visibleColumns: { [key: string]: boolean };
    chartViewMode: 'modal' | 'page';
}

export type SortOrder = 'default';
export type MonitorSortOrder = 'default' | 'pressure-desc' | 'chg-desc' | 'chg-asc';

export type Theme = 'dark';
export type ViewMode = 'kiwiTrailTable';
export type AppScreen = 'scanner' | 'chart';


export interface Notification {
  id: number;
  symbol: string;
  timeframe: Timeframe | 'N/A';
  rsi?: number;
  price?: number;
  type: 'kiwi-bullish-flip' | 'kiwi-bearish-flip' | 'supertrend-buy' | 'supertrend-sell' | 'accumulation-volume'; // Simplified types
  read: boolean;
  body?: string;
  value?: number;
  timestamp: number;
  candleTimestamp?: number;
}

export interface VolumeProfileData {
    profile: { price: number; volume: number; buyVolume: number; sellVolume: number; }[];
    poc: number;
    vah: number;
    val: number;
    maxVolume: number;
    minPrice: number;
    maxPrice: number;
}

export interface Narrative {
    name: string;
    symbols: string[];
}

export interface RelativeStrengthData {
    symbol: string;
    currentRelativeStrength: number;
    priceChange: number;
    history: { time: number, value: number }[];
}

export interface NarrativePerformanceData {
    name: string;
    averagePerformance: number;
    totalValue: number; // For treemap sizing
    symbols: { symbol: string; performance: number }[];
}

// === NEW TYPES for Kiwi Trail Grid ===
export type KiwiData = {
    '3m': SymbolData;
    '5m': SymbolData;
    '15m': SymbolData;
    '30m': SymbolData; // Added for Algo
    '1h': SymbolData;
    '4h': SymbolData;
};

export interface KiwiTrailRowData {
    symbol: string;
    price: number;
    change24h: number;
    change15m: number;
    ticks5m: number;
    spotVolume1h: number;
    delta15m: number;
    cvd15m: number;
    delta1h: number;
    cvd1h: number;
    oiChange4h: number;
    oiChange8h: number;
    fundingRate: number;
    dailyVwap: number | null;
    vsBtc1h: number;
    rsi4h: number;
    atr1h: number;
    kiwiData: KiwiData;
    kiwiFlips: {
        '3m': boolean;
        '5m': boolean;
        '15m': boolean;
        '1h': boolean;
        '4h': boolean;
    };
    highLowAlgo: { // Added Algo signals for the table
        '5m'?: 'BUY' | 'SELL' | 'SL_HIT' | 'NONE';
        '15m'?: 'BUY' | 'SELL' | 'SL_HIT' | 'NONE';
        '30m'?: 'BUY' | 'SELL' | 'SL_HIT' | 'NONE';
        '1h'?: 'BUY' | 'SELL' | 'SL_HIT' | 'NONE';
    };
    highLowAlgoRecency: {
        '5m': boolean;
        '15m': boolean;
        '30m': boolean;
        '1h': boolean;
    };
}

export interface AutomationLogEntry {
    id: number;
    timestamp: number;
    symbol: string;
    timeframe: Timeframe;
    type: string;
    price: number;
    quantity?: number;
    buyAmount?: number;
    status?: 'sent' | 'failed';
    error?: string;
}

export const KIWI_TIMEFRAMES: Timeframe[] = ['3m', '5m', '15m', '1h', '4h'];
export type SortKey = 'symbol' | 'price' | 'change24h' | 'change15m' | 'ticks5m' | 'spotVolume1h' | 'delta15m' | 'cvd15m' | 'delta1h' | 'cvd1h' | 'oiChange4h' | 'oiChange8h' | 'fundingRate' | 'vsBtc1h' | 'rsi4h' | 'kt-3m' | 'kt-5m' | 'kt-15m' | 'kt-1h' | 'kt-4h' | 'hl-5m' | 'hl-15m' | 'hl-30m' | 'hl-1h';
export type SortDirection = 'asc' | 'desc';