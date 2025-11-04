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
    luxalgoTrail?: { time: number; bias: number; level: number; }[];
    supertrend?: { time: number; up: number | null; dn: number | null; trend: number }[];
    cvd?: RsiDataPoint[];
}

export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | '1d' | '3d' | '1w';


export interface AlertConditions {
    luxalgoBullishFlip: boolean;
    luxalgoBearishFlip: boolean;
    supertrendBuy: boolean;
    supertrendSell: boolean;
}

export interface TrailingStopSettings {
    distributionLength: 10 | 100;
    dataLength: 1 | 5;
    useHeikinAshiForTrail: boolean;
}

export interface AnomalousBuyingVolumeSettings {
    multiplier: number;
    lookbackPeriod: '4h' | '6h' | '12h' | '24h' | '80c' | '120c';
    scanWindow: number;
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
    anomalousBuyingVolumeSettings: AnomalousBuyingVolumeSettings;
    selectedAssetList: 'MASTER' | 'SECONDARY' | 'TERTIARY' | 'CUSTOM';
    visibleColumns: { [key: string]: boolean };
    chartViewMode: 'modal' | 'page';
    enableWebhooks: boolean;
    webhookUrl: string;
}

export type SortOrder = 'default';
export type MonitorSortOrder = 'default' | 'pressure-desc' | 'chg-desc' | 'chg-asc';

export type Theme = 'dark';
export type ViewMode = 'kiwiTrailTable';
export type AppScreen = 'scanner' | 'chart';


export interface Notification {
  id: number;
  symbol: string;
  timeframe: Timeframe;
  rsi?: number;
  price?: number;
  type: 'luxalgo-bullish-flip' | 'luxalgo-bearish-flip' | 'supertrend-buy' | 'supertrend-sell' | 'accumulation-volume'; // Simplified types
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
    '5m': SymbolData;
    '15m': SymbolData;
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
    kiwiData: KiwiData;
    kiwiFlips: {
        '5m': boolean;
        '15m': boolean;
        '1h': boolean;
        '4h': boolean;
    };
}

export const KIWI_TIMEFRAMES: Timeframe[] = ['5m', '15m', '1h', '4h'];
export type SortKey = 'symbol' | 'price' | 'change24h' | 'change15m' | 'ticks5m' | 'spotVolume1h' | 'delta15m' | 'cvd15m' | 'delta1h' | 'cvd1h' | 'oiChange4h' | 'oiChange8h' | 'fundingRate' | 'vsBtc1h' | 'rsi4h' | 'kt-5m' | 'kt-15m' | 'kt-1h' | 'kt-4h';
export type SortDirection = 'asc' | 'desc';


// === NEW TYPES for MEXC Grid ===
export interface MexcKiwiData {
    '1m': SymbolData;
    '5m': SymbolData;
    '15m': SymbolData;
}
export interface MexcKiwiFlips {
    '1m': boolean;
    '5m': boolean;
    '15m': boolean;
}
export interface MexcTableRowData {
    symbol: string;
    price: number;
    change5m: number;
    change24h: number;
    volume24h: number;
    dailyVwap: number | null;
    rsi5m: number;
    kiwiData: MexcKiwiData;
    kiwiFlips: MexcKiwiFlips;
}

export const MEXC_KIWI_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m'];
export type MexcSortKey = 'symbol' | 'price' | 'change5m' | 'change24h' | 'volume24h' | 'rsi5m' | 'kt-1m' | 'kt-5m' | 'kt-15m';
// Fix: Add missing DEX types to resolve import errors.
// === NEW TYPES for DEX Grid ===
export type DexTimeframe = '5m' | '15m' | '1h' | '4h';
export const DEX_KIWI_TIMEFRAMES: DexTimeframe[] = ['5m', '15m', '1h', '4h'];

export interface DexTableRowData {
    address: string;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
    change15m: number;
    kiwiData: {
        '5m': SymbolData;
        '15m': SymbolData;
        '1h': SymbolData;
        '4h': SymbolData;
    };
    kiwiFlips: {
        '5m': boolean;
        '15m': boolean;
        '1h': boolean;
        '4h': boolean;
    };
}

export type DexSortKey = 'symbol' | 'price' | 'change24h' | 'volume24h' | 'change15m' | 'kt-5m' | 'kt-15m' | 'kt-1h' | 'kt-4h';