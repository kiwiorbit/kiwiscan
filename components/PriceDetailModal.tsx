

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Label, ReferenceArea, Scatter } from 'recharts';
import type { SymbolData, Settings, Timeframe, VolumeProfileData, PriceDataPoint, HighLowAlgoSignalPoint } from '../types';
import { calculateVolumeProfile } from '../services/volumeProfileService';
import { fetchRsiForSymbol } from '../services/binanceService';

interface ModalProps {
    symbol: string;
    onClose: () => void;
    settings: Settings;
    timeframe: Timeframe;
    initialState?: {
        showFibLevels?: boolean;
        showTrailingStop?: boolean;
        useHeikinAshi?: boolean;
        showHighLowAlgo?: boolean;
    };
}

const PriceDetailModal: React.FC<ModalProps> = ({ symbol, onClose, settings, timeframe, initialState }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartAreaRef = useRef<HTMLDivElement>(null);
    const optionsMenuRef = useRef<HTMLDivElement>(null);
    
    // Internal state for on-demand data fetching
    const [chartData, setChartData] = useState<SymbolData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showVolumeProfile, setShowVolumeProfile] = useState(false);
    const [showFibLevels, setShowFibLevels] = useState(initialState?.showFibLevels ?? timeframe === '1d');
    const [showTrailingStop, setShowTrailingStop] = useState(initialState?.showTrailingStop ?? true);
    const [showHighLowAlgo, setShowHighLowAlgo] = useState(initialState?.showHighLowAlgo ?? true);
    const [showSupertrend, setShowSupertrend] = useState(false);
    const [useHeikinAshi, setUseHeikinAshi] = useState(initialState?.useHeikinAshi ?? settings.trailingStopSettings.useHeikinAshiForTrail);
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const trailAllowedTimeframes: Timeframe[] = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];
    const isTrailAllowed = trailAllowedTimeframes.includes(timeframe);
    
    // On-demand data fetching
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const localSettings = {
                    ...settings,
                    trailingStopSettings: {
                        ...settings.trailingStopSettings,
                        useHeikinAshiForTrail: useHeikinAshi,
                    }
                };
                // Always fetch CEX data now
                const fetchedData = await fetchRsiForSymbol(`${symbol}.P`, timeframe, localSettings);
                setChartData(fetchedData);
            } catch (error) {
                console.error("Failed to fetch modal data:", error);
                setChartData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [symbol, timeframe, settings, useHeikinAshi, refreshTrigger]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setIsMoreOptionsOpen(false);
            }
        };
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);

    const lineChartData = useMemo(() => {
        if (!chartData?.klines) return [];
        
        const klinesMap = new Map(chartData.klines.map(k => [k.time, k]));

        const trailMap = new Map<number, { bias: number; level: number }>(
            chartData.kiwiTrail?.map(p => [p.time, { bias: p.bias, level: p.level }]) ?? []
        );
        const supertrendMap = new Map<number, { up: number | null; dn: number | null; trend: number }>(
            chartData.supertrend?.map(p => [p.time, { up: p.up, dn: p.dn, trend: p.trend }]) ?? []
        );
        const highLowAlgoMap = new Map<number, HighLowAlgoSignalPoint>(
            chartData.highLowAlgoSignals?.map(s => [s.time, s]) ?? []
        );
        const highLowChannelMap = new Map<number, { high: number, low: number }>(
            chartData.highLowAlgoChannel?.map(c => [c.time, { high: c.high, low: c.low }]) ?? []
        );
        
        return chartData.klines.map((kline, index, arr) => {
            const trailPoint = trailMap.get(kline.time);
            const prevTrailPoint = index > 0 ? trailMap.get(arr[index - 1].time) : undefined;
            
            let bullishFlipMark = null;
            let bearishFlipMark = null;

            if (trailPoint && prevTrailPoint && prevTrailPoint.bias !== trailPoint.bias) {
                if (trailPoint.bias === 1) { // BULLISH
                    bullishFlipMark = trailPoint.level;
                } else { // BEARISH
                    bearishFlipMark = trailPoint.level;
                }
            }
            
            const st = supertrendMap.get(kline.time);
            const prevSt = index > 0 ? supertrendMap.get(arr[index - 1].time) : undefined;
            let buySignal = null;
            let sellSignal = null;
            if (st && prevSt && prevSt.trend !== st.trend) {
                if (st.trend === 1 && st.up) { // Flip to bullish
                    buySignal = st.up;
                }
                if (st.trend === -1 && st.dn) { // Flip to bearish
                    sellSignal = st.dn;
                }
            }

            const algoSignal = highLowAlgoMap.get(kline.time);
            const algoChannel = highLowChannelMap.get(kline.time);

            return {
                ...kline,
                bullishTrail: trailPoint?.bias === 1 ? trailPoint.level : null,
                bearishTrail: trailPoint?.bias === 0 ? trailPoint.level : null,
                bullishFlipMark,
                bearishFlipMark,
                supertrendUp: st?.trend === 1 ? st.up : null,
                supertrendDn: st?.trend === -1 ? st.dn : null,
                buySignal,
                sellSignal,
                algoBuy: algoSignal?.type === 'BUY' ? kline.low * 0.998 : null,
                algoSell: algoSignal?.type === 'SELL' ? kline.high * 1.002 : null,
                algoSL: algoSignal?.type === 'SL_HIT' ? kline.low * 0.998 : null,
                algoHighChannel: algoChannel?.high,
                algoLowChannel: algoChannel?.low,
            };
        });
    }, [chartData]);
    
    const volumeProfileData: VolumeProfileData | null = useMemo(() => {
        if (!chartData?.klines || chartData.klines.length === 0) return null;
        return calculateVolumeProfile(chartData.klines, 100); // High resolution volume profile
    }, [chartData?.klines]);
    
    const fibLevels = useMemo(() => {
        if (!lineChartData || lineChartData.length < 2) return { gp: null, fib786: null };

        let highestHigh = -Infinity;
        let lowestLow = Infinity;
        let highestHighIndex = -1;
        let lowestLowIndex = -1;

        lineChartData.forEach((k, index) => {
            if (k.high > highestHigh) {
                highestHigh = k.high;
                highestHighIndex = index;
            }
            if (k.low < lowestLow) {
                lowestLow = k.low;
                lowestLowIndex = index;
            }
        });

        const range = highestHigh - lowestLow;
        if (range === 0) return { gp: null, fib786: null };
        
        let gpTop, gpBottom, fib786;
        
        if (lowestLowIndex < highestHighIndex) { // Uptrend
            // Retracement down from high
            gpTop = highestHigh - (range * 0.618);
            gpBottom = highestHigh - (range * 0.65);
            fib786 = highestHigh - (range * 0.786);
        } else { // Downtrend
            // Retracement up from low
            gpTop = lowestLow + (range * 0.65);
            gpBottom = lowestLow + (range * 0.618);
            fib786 = lowestLow + (range * 0.786);
        }

        return { 
            gp: { top: Math.max(gpTop, gpBottom), bottom: Math.min(gpTop, gpBottom) },
            fib786
        };
    }, [lineChartData]);

    const CustomTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="p-2 bg-dark-card/80 backdrop-blur-lg rounded-lg shadow-xl border border-dark-border/50 text-sm">
                    <p className="font-bold text-light-text">{new Date(point.time).toUTCString()}</p>
                    <p>Open: <span style={{ color: settings.textColor }}>{point?.open?.toFixed(4) ?? 'N/A'}</span></p>
                    <p>High: <span className="text-green-500">{point?.high?.toFixed(4) ?? 'N/A'}</span></p>
                    <p>Low: <span className="text-red-500">{point?.low?.toFixed(4) ?? 'N/A'}</span></p>
                    <p>Close: <span style={{ color: settings.textColor }}>{point?.close?.toFixed(4) ?? 'N/A'}</span></p>
                </div>
            );
        }
        return null;
    };
    
    const OptionButton: React.FC<{ icon: string; label: string; onClick: () => void; isActive: boolean; disabled?: boolean; title: string; }> = ({ icon, label, onClick, isActive, disabled, title }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                isActive ? 'bg-primary/20 text-primary' : 'hover:bg-dark-border'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <i className={`fa-solid ${icon} w-5 text-center`}></i>
            <span>{label}</span>
        </button>
    );

    const ModalContent = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
                </div>
            );
        }
       if (!chartData || !chartData.klines || chartData.klines.length === 0) {
            return (
               <div className="flex-grow flex items-center justify-center text-center text-medium-text">
                   <div>
                        <i className="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
                        <p>Could not load chart data for {symbol}.</p>
                   </div>
               </div>
           )
       }
        return (
             <div ref={chartContainerRef} className="relative flex-grow p-4 bg-black rounded-b-2xl flex items-stretch">
                    <div ref={chartAreaRef} className="relative flex-grow h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} syncId="priceSync" margin={{ top: 5, right: -15, left: 10, bottom: 5 }}>
                                <XAxis dataKey="time" hide={true} />
                                <YAxis orientation="right" domain={['auto', 'auto']} stroke={settings.textColor} fontSize={12} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: settings.textColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
                                
                                {showFibLevels && fibLevels.gp && (
                                    <ReferenceArea
                                        y1={fibLevels.gp.top}
                                        y2={fibLevels.gp.bottom}
                                        stroke="#facc15"
                                        strokeOpacity={0.5}
                                        fill="#facc15"
                                        fillOpacity={0.2}
                                    >
                                        <Label value="GP" offset={10} position="insideRight" style={{ fill: '#facc15', fontSize: 10, opacity: 0.9 }} />
                                    </ReferenceArea>
                                )}

                                {showFibLevels && fibLevels.fib786 !== null && (
                                    <ReferenceLine y={fibLevels.fib786} stroke="#a78bfa" strokeDasharray="3 3" strokeOpacity={0.8}>
                                        <Label value="0.786" offset={10} position="insideRight" style={{ fill: '#a78bfa', fontSize: 10, opacity: 0.9 }} />
                                    </ReferenceLine>
                                )}

                                <Line type="monotone" dataKey="close" stroke={settings.rsiColor} strokeWidth={settings.lineWidth} dot={false} name="Price" isAnimationActive={false} />
                                
                                {isTrailAllowed && showTrailingStop && (
                                    <>
                                        <Line type="monotone" dataKey="bullishTrail" stroke="#089981" strokeWidth={2} dot={false} name="Bullish Trail" isAnimationActive={false} connectNulls={false} strokeDasharray="3 3" />
                                        <Line type="monotone" dataKey="bearishTrail" stroke="#F23645" strokeWidth={2} dot={false} name="Bearish Trail" isAnimationActive={false} connectNulls={false} strokeDasharray="3 3" />
                                        {/* FIX: Ensure Scatter components for flips are rendered */}
                                        <Scatter name="Bullish Flip" dataKey="bullishFlipMark" fill="#089981" shape="circle" r={5} isAnimationActive={false} zIndex={100} />
                                        <Scatter name="Bearish Flip" dataKey="bearishFlipMark" fill="#F23645" shape="circle" r={5} isAnimationActive={false} zIndex={100} />
                                    </>
                                )}
                                
                                {showSupertrend && (
                                    <>
                                        <Line dataKey="supertrendUp" stroke="#e6f4f5" strokeWidth={2} dot={false} name="Supertrend Up" isAnimationActive={false} connectNulls={false} />
                                        <Line dataKey="supertrendDn" stroke="#cb59d9" strokeWidth={2} dot={false} name="Supertrend Down" isAnimationActive={false} connectNulls={false} />
                                    </>
                                )}

                                {showHighLowAlgo && (
                                    <>
                                        <Line type="stepAfter" dataKey="algoHighChannel" stroke="#ef4444" strokeWidth={1.5} dot={false} name="High Channel" isAnimationActive={false} connectNulls={false} strokeDasharray="5 5" strokeOpacity={0.6} />
                                        <Line type="stepAfter" dataKey="algoLowChannel" stroke="#29ffb8" strokeWidth={1.5} dot={false} name="Low Channel" isAnimationActive={false} connectNulls={false} strokeDasharray="5 5" strokeOpacity={0.6} />
                                        <Scatter dataKey="algoBuy" fill="#29ffb8" shape="triangle" r={5} isAnimationActive={false} zIndex={100} />
                                        <Scatter dataKey="algoSell" fill="#ef4444" shape="triangle" r={5} isAnimationActive={false} shapeRendering="crispEdges" transform="rotate(180)" zIndex={100} />
                                        <Scatter dataKey="algoSL" fill="#f59e0b" shape="cross" r={5} isAnimationActive={false} zIndex={100} />
                                    </>
                                )}

                                {showVolumeProfile && volumeProfileData && (
                                    <>
                                        <ReferenceLine y={volumeProfileData.poc} stroke="#facc15" strokeDasharray="3 3" strokeOpacity={0.9}>
                                            <Label value="POC" offset={10} position="insideRight" style={{ fill: '#facc15', fontSize: 10 }} />
                                        </ReferenceLine>
                                        <ReferenceLine y={volumeProfileData.vah} stroke={settings.textColor} strokeDasharray="2 4" strokeOpacity={0.6}>
                                            <Label value="VAH" offset={10} position="insideRight" style={{ fill: settings.textColor, fontSize: 10, opacity: 0.7 }} />
                                        </ReferenceLine>
                                        <ReferenceLine y={volumeProfileData.val} stroke={settings.textColor} strokeDasharray="2 4" strokeOpacity={0.6}>
                                            <Label value="VAL" offset={10} position="insideRight" style={{ fill: settings.textColor, fontSize: 10, opacity: 0.7 }} />
                                        </ReferenceLine>
                                    </>
                                )}
                                
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                     {showVolumeProfile && volumeProfileData && (
                        <VolumeProfileDisplay data={volumeProfileData} />
                    )}
                </div>
        )
    };

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-40 p-4">
            <div ref={modalRef} className="relative w-full max-w-4xl h-[60vh] md:h-[70vh] lg:h-[85vh] max-h-[800px] bg-dark-card rounded-2xl shadow-2xl flex flex-col border border-dark-border/50">
                <div className="flex justify-between items-start p-4 border-b border-dark-border gap-4">
                    <div className="flex-grow">
                        <h2 className="text-xl md:text-2xl font-bold text-light-text">
                           {symbol}
                           <span className="text-base font-normal text-medium-text">({timeframe})</span>
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-medium-text mt-1">
                            <span>Price: <span className="font-semibold text-light-text">${chartData?.price?.toFixed(4) ?? 'N/A'}</span></span>
                        </div>
                    </div>
                     <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={handleRefresh}
                            className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text hover:bg-dark-border transition-colors"
                            aria-label="Refresh chart"
                            title="Refresh Chart"
                        >
                            <i className="fa-solid fa-sync"></i>
                        </button>
                        <div ref={optionsMenuRef} className="relative">
                            <button
                                onClick={() => setIsMoreOptionsOpen(prev => !prev)}
                                className="text-xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text hover:bg-dark-border transition-colors"
                                aria-label="More options"
                                title="More Options"
                            >
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            {isMoreOptionsOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-dark-bg/95 backdrop-blur-lg border border-dark-border/50 rounded-xl shadow-2xl p-2 z-50 origin-top-right animate-dropdown-in">
                                    <ul className="space-y-1">
                                        <li><OptionButton icon="fa-compass" label="High/Low Signals" onClick={() => setShowHighLowAlgo(p => !p)} isActive={showHighLowAlgo} title="Toggle High/Low Algo Signals" /></li>
                                        <li><OptionButton icon="fa-shoe-prints" label="Kiwi Trail" onClick={() => setShowTrailingStop(p => !p)} isActive={showTrailingStop} disabled={!isTrailAllowed} title={isTrailAllowed ? "Toggle Statistical Trailing Stop" : "Not available on this timeframe"} /></li>
                                        <li><OptionButton icon="fa-chart-simple" label="Heikin Ashi Trail" onClick={() => setUseHeikinAshi(p => !p)} isActive={useHeikinAshi} title="Toggle Heikin Ashi smoothing for Kiwi Trail" /></li>
                                        <li><OptionButton icon="fa-arrow-trend-up" label="Supertrend" onClick={() => setShowSupertrend(p => !p)} isActive={showSupertrend} title="Toggle Supertrend" /></li>
                                        <li><OptionButton icon="fa-wave-square" label="Fib Levels" onClick={() => setShowFibLevels(p => !p)} isActive={showFibLevels} title="Toggle Fibonacci Levels" /></li>
                                        <li><OptionButton icon="fa-chart-bar" label="Volume Profile" onClick={() => setShowVolumeProfile(p => !p)} isActive={showVolumeProfile} title="Toggle Volume Profile" /></li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg text-medium-text hover:text-light-text transition-colors" aria-label="Close chart">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
                
                <ModalContent />
            </div>
        </div>
    );
};

interface VolumeProfileDisplayProps {
    data: VolumeProfileData;
}

const VolumeProfileDisplay: React.FC<VolumeProfileDisplayProps> = ({ data }) => {
    const { profile, maxVolume } = data;
    
    const sellColor = '#be185d'; // pink-700
    const buyColor = '#0891b2'; // cyan-600
    const bgColor = '#374151'; // gray-700

    return (
        <div className="relative w-24 h-full flex flex-col-reverse ml-2" aria-label="Volume Profile">
            {profile.map((bucket, index) => {
                const totalWidthPercent = (bucket.volume / maxVolume) * 100;
                const sellWidthPercent = bucket.volume > 0 ? (bucket.sellVolume / bucket.volume) * 100 : 0;
                const buyWidthPercent = bucket.volume > 0 ? (bucket.buyVolume / bucket.volume) * 100 : 0;

                return (
                    <div 
                        key={index} 
                        className="flex-1 flex items-center justify-end" 
                        title={`Price: ${bucket.price.toFixed(4)}, Vol: ${bucket.volume.toFixed(2)} (Buy: ${bucket.buyVolume.toFixed(2)}, Sell: ${bucket.sellVolume.toFixed(2)})`}
                    >
                        <div
                            className="relative h-full flex"
                            style={{ width: `${totalWidthPercent}%`, backgroundColor: bgColor }}
                        >
                            {/* Sell volume bar */}
                            <div
                                className="h-full"
                                style={{ width: `${sellWidthPercent}%`, backgroundColor: sellColor }}
                            />
                            {/* Buy volume bar */}
                            <div
                                className="h-full"
                                style={{ width: `${buyWidthPercent}%`, backgroundColor: buyColor }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export default PriceDetailModal;