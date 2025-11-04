import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchRsiForSymbol } from '../services/binanceService';
import { fetchMexcSymbolData } from '../services/mexcService';
import type { SymbolData, Timeframe } from '../types';

declare global {
    interface Window { echarts: any; }
}

const PriceDetailPage: React.FC = () => {
    const { handleBackToScanner, settings, activeSymbol, timeframe, handleTimeframeChange, activeSymbolSource } = useAppContext();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<any>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
    const [showSupertrend, setShowSupertrend] = useState(false);
    const [showVolumeProfile, setShowVolumeProfile] = useState(true);
    const [useHeikinAshi, setUseHeikinAshi] = useState(settings.trailingStopSettings.useHeikinAshiForTrail);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        const chartContainer = chartContainerRef.current;
        if (!chartContainer || !window.echarts || !activeSymbol) return;
        
        const isMobile = window.innerWidth < 768;

        chartInstanceRef.current = window.echarts.init(chartContainer, 'dark', { renderer: 'canvas' });
        
        resizeObserverRef.current = new ResizeObserver(() => {
            chartInstanceRef.current?.resize();
        });
        resizeObserverRef.current.observe(chartContainer);

        const fetchDataAndRender = async () => {
            setLoading(true);
            setError(null);
            try {
                const localSettings = {
                    ...settings,
                    trailingStopSettings: {
                        ...settings.trailingStopSettings,
                        useHeikinAshiForTrail: useHeikinAshi,
                    }
                };
                
                const symbolToFetch = activeSymbolSource === 'cex' ? `${activeSymbol}.P` : activeSymbol;
                const data: SymbolData = activeSymbolSource === 'mexc'
                    ? await fetchMexcSymbolData(symbolToFetch, timeframe as Timeframe, localSettings)
                    : await fetchRsiForSymbol(symbolToFetch, timeframe, localSettings);

                if (!data || data.klines.length === 0) {
                    throw new Error('No data returned for the symbol.');
                }
                
                const volumeProfile = showVolumeProfile ? data.volumeProfile : null;

                const dates = data.klines.map(k => new Date(k.time).toISOString().slice(0, 16).replace('T', ' '));
                const candlestickData = data.klines.map(k => [k.open, k.close, k.low, k.high]);
                const lineData = data.klines.map(k => k.close);
                
                const kiwiBullishData = data.luxalgoTrail?.map(t => t.bias === 1 ? t.level : null);
                const kiwiBearishData = data.luxalgoTrail?.map(t => t.bias === 0 ? t.level : null);
                const supertrendUpData = showSupertrend ? data.supertrend?.map(t => t.up) : [];
                const supertrendDownData = showSupertrend ? data.supertrend?.map(t => t.dn) : [];

                const flipMarkers = data.luxalgoTrail ? data.luxalgoTrail.reduce((acc, trail, i, arr) => {
                    if (i > 0 && trail.bias !== arr[i-1].bias) {
                        const kline = data.klines[i];
                        if (trail.bias === 1) { // Flipped to BULLISH
                             acc.push({
                                name: 'Bullish Flip',
                                coord: [i, kline.low * 0.995], // Place BELOW the low
                                itemStyle: { color: '#089981' }
                            });
                        } else { // Flipped to BEARISH
                             acc.push({
                                name: 'Bearish Flip',
                                coord: [i, kline.high * 1.005], // Place ABOVE the high
                                itemStyle: { color: '#F23645' }
                            });
                        }
                    }
                    return acc;
                }, [] as any[]) : [];

                const markLines = [];
                if (volumeProfile) {
                    markLines.push(
                        { yAxis: volumeProfile.poc, name: 'POC', lineStyle: { color: '#facc15', type: 'dashed' }, label: { formatter: 'POC', position: 'insideStartTop' } },
                        { yAxis: volumeProfile.vah, name: 'VAH', lineStyle: { color: '#a8a29e', type: 'dotted' }, label: { formatter: 'VAH', position: 'insideStartTop' } },
                        { yAxis: volumeProfile.val, name: 'VAL', lineStyle: { color: '#a8a29e', type: 'dotted' }, label: { formatter: 'VAL', position: 'insideStartTop' } }
                    );
                }
                
                const vpCategories = volumeProfile?.profile.map(p => p.price.toFixed(4)) ?? [];
                const vpBuyData = volumeProfile?.profile.map(p => p.buyVolume) ?? [];
                const vpSellData = volumeProfile?.profile.map(p => p.sellVolume) ?? [];

                const option = {
                    backgroundColor: 'transparent',
                    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                    legend: { 
                        data: ['Kiwi Trail Bull', 'Kiwi Trail Bear', 'Supertrend Up', 'Supertrend Down'], 
                        inactiveColor: '#777', 
                        textStyle: { color: '#e5e9f2', fontSize: isMobile ? 10 : 12 },
                        itemGap: isMobile ? 8 : 10,
                        top: 0
                    },
                    grid: [
                        { left: isMobile ? '18%' : '12%', right: isMobile ? '12%' : '8%', bottom: isMobile ? 50 : 60, containLabel: false },
                        { left: isMobile ? '2%' : '1%', right: isMobile ? '82%' : '89%', bottom: isMobile ? 50 : 60, containLabel: false }
                    ],
                    xAxis: [
                        { type: 'category', data: dates, gridIndex: 0, boundaryGap: false, axisLine: { onZero: false, lineStyle: { color: '#b0b8c9' } }, axisLabel: { fontSize: isMobile ? 10 : 12 } },
                        { gridIndex: 1, type: 'value', show: false, inverse: true }
                    ],
                    yAxis: [
                        { type: 'value', gridIndex: 0, scale: true, position: 'right', splitLine: { show: false }, axisLine: { lineStyle: { color: '#b0b8c9' } }, axisLabel: { fontSize: isMobile ? 10 : 12 } },
                        { gridIndex: 1, type: 'category', data: vpCategories, show: false }
                    ],
                    dataZoom: [
                        { type: 'inside', xAxisIndex: [0], start: 0, end: 100 },
                        {
                            show: true,
                            type: 'slider',
                            xAxisIndex: [0],
                            bottom: 10,
                            height: isMobile ? 20 : 25,
                            start: 0,
                            end: 100,
                            backgroundColor: 'rgba(43, 45, 49, 0.5)', // dark-card with alpha
                            dataBackground: {
                                lineStyle: { color: '#4a5568', opacity: 0.3 },
                                areaStyle: { color: '#4a5568', opacity: 0.1 }
                            },
                            fillerColor: 'rgba(41, 255, 184, 0.2)',
                            borderColor: 'transparent',
                            handleStyle: {
                                color: '#383A40' // dark-border
                            },
                            textStyle: {
                                color: '#b0b8c9' // medium-text
                            },
                        }
                    ],
                    series: [
                        { name: chartType === 'candlestick' ? 'Candlestick' : 'Price', type: chartType, data: chartType === 'candlestick' ? candlestickData : lineData, xAxisIndex: 0, yAxisIndex: 0, itemStyle: chartType === 'candlestick' ? { color: '#089981', color0: '#F23645', borderColor: '#089981', borderColor0: '#F23645' } : { color: '#29ffb8' }, markPoint: { symbol: 'circle', symbolSize: 10, data: flipMarkers, label: { show: false } }, markLine: { symbol: ['none', 'none'], silent: true, data: markLines, label: { textStyle: { color: '#e5e9f2' } } } },
                        { name: 'Kiwi Trail Bull', type: 'line', data: kiwiBullishData, xAxisIndex: 0, yAxisIndex: 0, smooth: false, symbol: 'none', lineStyle: { color: '#089981', width: 2 } },
                        { name: 'Kiwi Trail Bear', type: 'line', data: kiwiBearishData, xAxisIndex: 0, yAxisIndex: 0, smooth: false, symbol: 'none', lineStyle: { color: '#F23645', width: 2 } },
                        { name: 'Supertrend Up', type: 'line', data: supertrendUpData, xAxisIndex: 0, yAxisIndex: 0, smooth: false, symbol: 'none', lineStyle: { color: 'rgba(8, 153, 129, 0.5)', width: 1.5, type: 'dotted' } },
                        { name: 'Supertrend Down', type: 'line', data: supertrendDownData, xAxisIndex: 0, yAxisIndex: 0, smooth: false, symbol: 'none', lineStyle: { color: 'rgba(242, 54, 69, 0.5)', width: 1.5, type: 'dotted' } },
                        { name: 'Sell Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, stack: 'vp', data: vpSellData, itemStyle: { color: 'rgba(242, 54, 69, 0.5)', borderWidth: 0 }, barWidth: '100%' },
                        { name: 'Buy Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, stack: 'vp', data: vpBuyData, itemStyle: { color: 'rgba(8, 153, 129, 0.5)', borderWidth: 0 }, barWidth: '100%' }
                    ]
                };
                chartInstanceRef.current.setOption(option, true);
                
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchDataAndRender();

        return () => {
            const observer = resizeObserverRef.current;
            const chart = chartInstanceRef.current;
            
            // Disconnect first
            observer?.disconnect();
            
            // Then dispose the chart
            chart?.dispose();

            chartInstanceRef.current = null;
            resizeObserverRef.current = null;
        };
    }, [settings, activeSymbol, timeframe, chartType, showSupertrend, showVolumeProfile, useHeikinAshi, refreshTrigger, activeSymbolSource]);

    return (
        <div className="w-full h-screen bg-dark-bg text-light-text flex flex-col p-2 sm:p-4">
            <header className="flex items-center pb-4 border-b border-dark-border flex-wrap gap-4">
                 <button
                    onClick={handleBackToScanner}
                    className="bg-dark-bg rounded-lg p-2 w-[36px] h-[36px] flex items-center justify-center border border-dark-border shadow-sm hover:bg-dark-border transition"
                    aria-label="Go back"
                >
                    <i className="fa-solid fa-arrow-left text-primary text-[22px]"></i>
                </button>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{activeSymbol}</h2>
                    <p className="text-sm text-medium-text">Chart ({timeframe})</p>
                </div>
                <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={handleRefresh} 
                        className="rounded-lg flex items-center justify-center w-[36px] h-[36px] transition-colors bg-dark-card hover:bg-dark-border text-light-text" 
                        title="Refresh Chart">
                        <i className="fa-solid fa-sync text-lg"></i>
                    </button>
                    <button 
                        onClick={() => setUseHeikinAshi(p => !p)} 
                        className={`rounded-lg flex items-center justify-center w-[36px] h-[36px] transition-colors ${useHeikinAshi ? 'bg-primary/20 text-primary' : 'bg-dark-card hover:bg-dark-border text-light-text'}`} 
                        title="Toggle Heikin Ashi Trail">
                        <i className="fa-solid fa-chart-simple text-lg"></i>
                    </button>
                    <button 
                        onClick={() => setShowSupertrend(p => !p)} 
                        className={`rounded-lg flex items-center justify-center w-[36px] h-[36px] transition-colors ${showSupertrend ? 'bg-primary/20 text-primary' : 'bg-dark-card hover:bg-dark-border text-light-text'}`} 
                        title="Toggle Supertrend">
                        <i className="fa-solid fa-arrow-trend-up text-lg"></i>
                    </button>
                    <button 
                        onClick={() => setShowVolumeProfile(p => !p)} 
                        className={`rounded-lg flex items-center justify-center w-[36px] h-[36px] transition-colors ${showVolumeProfile ? 'bg-primary/20 text-primary' : 'bg-dark-card hover:bg-dark-border text-light-text'}`} 
                        title="Toggle Volume Profile">
                        <i className="fa-solid fa-chart-bar text-lg"></i>
                    </button>
                    <button 
                        onClick={() => setChartType(p => p === 'candlestick' ? 'line' : 'candlestick')} 
                        className="rounded-lg flex items-center justify-center w-[36px] h-[36px] transition-colors bg-dark-card hover:bg-dark-border text-light-text" 
                        title={`Switch to ${chartType === 'candlestick' ? 'Line' : 'Candlestick'} Chart`}>
                        <i className={`fa-solid ${chartType === 'candlestick' ? 'fa-chart-line' : 'fa-chart-column'} text-lg`}></i>
                    </button>
                </div>
            </header>
            <main className="flex-grow flex pt-4 relative">
                {loading && <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-10"><i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i></div>}
                {error && <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-10 text-center"><div><i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl mb-4"></i><p className="font-bold">Failed to load chart</p><p className="text-sm text-medium-text">{error}</p></div></div>}
                <div ref={chartContainerRef} className="w-full h-full" />
            </main>
        </div>
    );
};

export default PriceDetailPage;