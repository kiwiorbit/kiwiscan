import React from 'react';
import DexGrid from './dex/DexGrid';
import { BASE_CHAIN_CONTRACTS } from '../constants';
import { useAppContext } from '../context/AppContext';
import { Timeframe } from '../types';

const DexScannerPage: React.FC = () => {
    const { settings, favorites, toggleFavorite, handleKiwiTrailCellClick } = useAppContext();

    // FIX: This wrapper is no longer strictly necessary if DexGrid's prop is updated,
    // but it provides a clear separation of concerns for DEX-specific interactions.
    const handleDexCellClick = (address: string, timeframe: Timeframe) => {
        handleKiwiTrailCellClick(address, timeframe, 'mexc'); // Using 'mexc' as a placeholder until 'dex' source is fully implemented.
    }

    return (
        <div className="animate-fade-in-slow">
            <DexGrid
                contracts={BASE_CHAIN_CONTRACTS}
                settings={settings}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onKiwiTrailCellClick={handleDexCellClick}
            />
        </div>
    );
};

export default DexScannerPage;
