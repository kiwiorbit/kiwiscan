
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { KiwiTrailRowData, Timeframe } from '../../types';
import { KIWI_TIMEFRAMES } from '../../types';
import LiveFeed from './LiveFeed';
import InfoPanels from './InfoPanels';
import VisualizerSorter from './VisualizerSorter';

type SortKey = 'favorites' | 'change24h' | 'spotVolume1h';

type FlipParticle = {
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
};

type FlipLogEntry = {
    id: number;
    message: string;
    symbol: string;
    timeframe: Timeframe;
};

interface KiwiVisualizerProps {
    data: KiwiTrailRowData[];
    favorites: string[];
    onSignalClick: (symbol: string, timeframe: Timeframe) => void;
}

const sortOptions: { key: SortKey; label: string; icon: string }[] = [
    { key: 'favorites', label: 'Favorites', icon: 'fa-star' },
    { key: 'change24h', label: 'Top Movers', icon: 'fa-rocket' },
    { key: 'spotVolume1h', label: 'Top Volume', icon: 'fa-chart-bar' },
];

const KiwiDot: React.FC<{ bias: number | undefined }> = ({ bias }) => {
    const color = bias === 1 ? 'bg-primary' : bias === 0 ? 'bg-red-500' : 'bg-dark-border';
    return <div className={`w-3 h-3 rounded-full ${color}`} />;
};

const KiwiVisualizer: React.FC<KiwiVisualizerProps> = ({ data, favorites, onSignalClick }) => {
    const [sortKey, setSortKey] = useState<SortKey>('favorites');
    const [flipParticles, setFlipParticles] = useState<FlipParticle[]>([]);
    const [flipLog, setFlipLog] = useState<FlipLogEntry[]>([]);
    const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
    const [flashingPlanet, setFlashingPlanet] = useState<{ symbol: string; type: 'bullish' | 'bearish' } | null>(null);
    const [linesVisible, setLinesVisible] = useState(true);

    const prevDataRef = useRef<Map<string, KiwiTrailRowData>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const binanceRef = useRef<HTMLDivElement>(null);
    const symbolRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; symbol: string; }[]>([]);

    const handleSortChange = (key: SortKey) => {
        if (key === sortKey) return;
        setLinesVisible(false); // Start fade out
        setTimeout(() => {
            setSortKey(key); // Change sort key after fade out
        }, 500);
    };

    const displayedSymbols = useMemo(() => {
        let sortedData: KiwiTrailRowData[];

        if (sortKey === 'favorites') {
            sortedData = data
                .filter(item => favorites.includes(item.symbol))
                .sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity));
        } else {
            const keyToSort = sortKey as 'change24h' | 'spotVolume1h';
            sortedData = [...data]
                .sort((a, b) => (b[keyToSort] ?? -Infinity) - (a[keyToSort] ?? -Infinity));
        }
        return sortedData.slice(0, 8);
    }, [data, sortKey, favorites]);

    useEffect(() => {
        const calculateLines = () => {
            if (!binanceRef.current || !containerRef.current || displayedSymbols.length === 0) {
                setLines([]);
                return;
            }
            const containerRect = containerRef.current.getBoundingClientRect();
            if (!containerRect || containerRect.width === 0) return;

            const bRect = binanceRef.current.getBoundingClientRect();
            const centerX = bRect.left + bRect.width / 2 - containerRect.left;
            const centerY = bRect.top + bRect.height / 2 - containerRect.top;

            const newLines = displayedSymbols.map(s => {
                const symbolEl = symbolRefs.current.get(s.symbol);
                if (!symbolEl) return null;
                const sRect = symbolEl.getBoundingClientRect();
                return {
                    symbol: s.symbol,
                    x1: centerX,
                    y1: centerY,
                    x2: sRect.left + sRect.width / 2 - containerRect.left,
                    y2: sRect.top + sRect.height / 2 - containerRect.top,
                };
            }).filter((l): l is { x1: number; y1: number; x2: number; y2: number; symbol: string; } => l !== null);
            
            setLines(newLines);
            const fadeInTimeout = setTimeout(() => {
                setLinesVisible(true);
            }, 50); // Small delay to ensure re-render before fade-in
            
            return () => clearTimeout(fadeInTimeout);
        };

        const resizeObserver = new ResizeObserver(calculateLines);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        
        const timeoutId = setTimeout(calculateLines, 100); 

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, [displayedSymbols]);
    
    useEffect(() => {
        const currentDataMap = new Map(displayedSymbols.map(item => [item.symbol, item]));
        const prevDataMap = prevDataRef.current;

        if (prevDataMap.size > 0 && binanceRef.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            if (!containerRect || containerRect.width === 0) return;

            const binanceRect = binanceRef.current.getBoundingClientRect();
            const startX = binanceRect.left + binanceRect.width / 2 - containerRect.left;
            const startY = binanceRect.top + binanceRect.height / 2 - containerRect.top;

            displayedSymbols.forEach((current) => {
                const prev = prevDataMap.get(current.symbol);
                if (prev) {
                    (KIWI_TIMEFRAMES).forEach(tf => {
                        const currentBias = current.kiwiData[tf]?.kiwiTrail?.slice(-1)[0]?.bias;
                        const prevBias = prev.kiwiData[tf]?.kiwiTrail?.slice(-1)[0]?.bias;

                        if (typeof currentBias === 'number' && typeof prevBias === 'number' && currentBias !== prevBias) {
                            const isBullish = currentBias === 1;
                            const message = `${current.symbol} ${tf} ${isBullish ? 'Bullish' : 'Bearish'} Flip`;
                            setFlipLog(prevLog => [{
                                id: Date.now() + Math.random(),
                                message,
                                symbol: current.symbol,
                                timeframe: tf
                            }, ...prevLog.slice(0, 19)]);
                            
                            const symbolEl = symbolRefs.current.get(current.symbol);
                            if (symbolEl) {
                                const rect = symbolEl.getBoundingClientRect();
                                if (!rect || rect.width === 0) return;

                                const endX = rect.left + rect.width / 2 - containerRect.left;
                                const endY = rect.top + rect.height / 2 - containerRect.top;
                                setFlipParticles(prevParticles => [
                                    ...prevParticles,
                                    { id: Date.now() + Math.random(), startX, startY, endX, endY, color: isBullish ? '#29ffb8' : '#ef4444' }
                                ]);
                                
                                setTimeout(() => {
                                    setFlashingPlanet({ symbol: current.symbol, type: isBullish ? 'bullish' : 'bearish' });
                                    setTimeout(() => setFlashingPlanet(null), 800);
                                }, 2800);
                            }
                        }
                    });
                }
            });
        }
        prevDataRef.current = currentDataMap;
    }, [displayedSymbols]);
    

    const removeFlipParticle = useCallback((id: number) => setFlipParticles(p => p.filter(particle => particle.id !== id)), []);


    const getPosition = (index: number, total: number) => {
        if (total === 0) return { top: '50%', left: '50%' };
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const radius = 30;
        const cx = 50;
        const cy = 50;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return { top: `${y}%`, left: `${x}%` };
    };

    const formatPercent = (val: number | undefined) => {
        if(val === undefined) return '...';
        return `${val.toFixed(2)}%`;
    };

    const formatPrice = (price: number | undefined) => {
         if(price === undefined) return '...';
         if (price >= 1000) return price.toFixed(2);
         if (price >= 1) return price.toFixed(4);
         return price.toPrecision(4);
    };

    return (
        <div ref={containerRef} className="kiwi-visualizer-grid relative w-full min-h-screen md:h-[85vh] max-h-[900px] rounded-2xl overflow-hidden p-2 md:p-4 lg:p-6">
            
            {/* --- MOBILE VIEW --- */}
            <div className="md:hidden flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 bg-dark-bg/80 backdrop-blur-sm border border-dark-border/50 rounded-lg p-1 z-30">
                    {sortOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => handleSortChange(option.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                sortKey === option.key ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'
                            }`}
                        >
                            <i className={`fa-solid ${option.icon}`}></i>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
                <div className="w-full max-w-sm bg-dark-bg/50 backdrop-blur-sm rounded-lg border border-dark-border/50 p-2 flex flex-col text-xs z-30 h-96">
                    <h3 className="font-bold text-sm text-center p-2 text-primary border-b border-dark-border">Live Signal Feed</h3>
                    <div className="flex-grow overflow-y-auto pr-1">
                        <ul className="space-y-1.5 mt-2">
                            {flipLog.map(item => (
                                <li key={item.id} className="animate-fade-in-slow text-medium-text">
                                    <button
                                        onClick={() => onSignalClick(item.symbol, item.timeframe)}
                                        className="flex gap-2 text-left w-full hover:bg-dark-border/50 rounded p-1 transition-colors"
                                        aria-label={`Open chart for ${item.message}`}
                                    >
                                        <span className={`font-bold ${item.message.includes('Bullish') ? 'text-primary' : 'text-red-500'}`}>
                                            {item.message.includes('Bullish') ? '▲' : '▼'}
                                        </span>
                                        <span>{item.message}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP VIEW --- */}
            <div className="hidden md:block">
                <VisualizerSorter currentSort={sortKey} onSort={handleSortChange} />
                <LiveFeed log={flipLog} onSignalClick={onSignalClick} />
                <InfoPanels symbols={displayedSymbols} />

                <div ref={binanceRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full bg-dark-card border-2 border-primary flex items-center justify-center text-lg md:text-xl font-bold text-primary shadow-2xl shadow-primary/30 animate-planet-pulse z-10">
                    BINANCE
                </div>

                {displayedSymbols.map((s, i) => {
                    const position = getPosition(i, displayedSymbols.length);
                    const changeColor = s.change24h >= 0 ? 'text-primary' : 'text-red-500';
                    const flashClass = flashingPlanet?.symbol === s.symbol 
                        ? (flashingPlanet.type === 'bullish' ? 'animate-planet-flash-bullish' : 'animate-planet-flash-bearish') 
                        : '';

                    return (
                        <div
                            key={s.symbol}
                            ref={el => { if (el) symbolRefs.current.set(s.symbol, el); else symbolRefs.current.delete(s.symbol); }}
                            onMouseEnter={() => setHoveredSymbol(s.symbol)}
                            onMouseLeave={() => setHoveredSymbol(null)}
                            className={`group absolute w-28 h-28 rounded-full bg-dark-card border border-dark-border flex flex-col items-center justify-center text-center p-1 text-xs font-bold shadow-lg transition-all duration-500 z-10 animate-gentle-orbit ${flashClass} hover:border-primary hover:bg-black`}
                            style={{
                                top: position.top,
                                left: position.left,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="transition-opacity duration-300 group-hover:opacity-0">
                                <div className="font-bold text-base text-light-text">{s.symbol.replace('USDT','')}</div>
                                <div className="font-mono text-sm text-medium-text">${formatPrice(s.price)}</div>
                                <div className={`font-mono text-sm ${changeColor}`}>{formatPercent(s.change24h)}</div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                {KIWI_TIMEFRAMES.map(tf => {
                                    const bias = s.kiwiData[tf]?.kiwiTrail?.slice(-1)[0]?.bias;
                                    return <KiwiDot key={tf} bias={bias} />;
                                })}
                            </div>
                        </div>
                    )
                })}
                
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                    {lines.map((line, i) => {
                        const isHovered = hoveredSymbol === line.symbol;
                        return (
                            <line 
                                key={i} 
                                x1={line.x1} y1={line.y1} 
                                x2={line.x2} y2={line.y2} 
                                stroke={isHovered ? '#29ffb8' : '#4a5568'}
                                strokeWidth={isHovered ? 3 : 2}
                                strokeOpacity={isHovered ? 1 : 0.2}
                                className={`transition-opacity duration-500 ease-in-out ${linesVisible ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )
                    })}
                </svg>
                
                {flipParticles.map(p => (
                    <div
                        key={p.id}
                        onAnimationEnd={() => removeFlipParticle(p.id)}
                        className="absolute rounded-full z-20 pointer-events-none"
                        style={{
                            top: 0,
                            left: 0,
                            width: '20px',
                            height: '20px',
                            backgroundColor: p.color,
                            boxShadow: `0 0 10px ${p.color}`,
                            offsetPath: `path('M ${p.startX} ${p.startY} L ${p.endX} ${p.endY}')`,
                            animation: 'particle-follow-path 3s linear forwards',
                            transform: 'translate(-50%, -50%)',
                        } as React.CSSProperties}
                    />
                ))}
            </div>
        </div>
    );
};

export default KiwiVisualizer;