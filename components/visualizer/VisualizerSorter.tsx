import React from 'react';

type SortKey = 'favorites' | 'change24h' | 'spotVolume1h';

interface VisualizerSorterProps {
    currentSort: SortKey;
    onSort: (key: SortKey) => void;
}

const sortOptions: { key: SortKey; label: string; icon: string }[] = [
    { key: 'favorites', label: 'Favorites', icon: 'fa-star' },
    { key: 'change24h', label: 'Top Movers', icon: 'fa-rocket' },
    { key: 'spotVolume1h', label: 'Top Volume', icon: 'fa-chart-bar' },
];

const VisualizerSorter: React.FC<VisualizerSorterProps> = ({ currentSort, onSort }) => {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-dark-bg/80 backdrop-blur-sm border border-dark-border/50 rounded-lg p-1 z-30">
            {sortOptions.map(option => (
                <button
                    key={option.key}
                    onClick={() => onSort(option.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                        currentSort === option.key ? 'bg-primary text-dark-bg' : 'hover:bg-dark-border text-light-text'
                    }`}
                >
                    <i className={`fa-solid ${option.icon}`}></i>
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default VisualizerSorter;