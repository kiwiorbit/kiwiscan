
import React from 'react';
import type { Timeframe } from '../../types';

interface LiveFeedProps {
    log: { id: number; message: string; symbol: string; timeframe: Timeframe }[];
    onSignalClick: (symbol: string, timeframe: Timeframe) => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ log, onSignalClick }) => {
    return (
        <div className="absolute top-1 left-1 md:left-1 lg:left-1 w-48 md:w-64 h-2/3 max-h-60 bg-dark-bg/50 backdrop-blur-sm rounded-lg border border-dark-border/50 p-2 flex flex-col text-xs z-30">
            <h3 className="font-bold text-sm text-center p-2 text-primary border-b border-dark-border">Live Signal Feed</h3>
            <div className="flex-grow overflow-y-auto pr-1">
                <ul className="space-y-1.5 mt-2">
                    {log.map(item => (
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
    );
};

export default LiveFeed;
