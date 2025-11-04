import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import MexcGrid from './mexc/MexcGrid';
import HaramWarningPopup from './HaramWarningPopup';

const MexcScannerPage: React.FC = () => {
    const { settings, favorites, toggleFavorite, handleKiwiTrailCellClick } = useAppContext();
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const hasSeenWarning = sessionStorage.getItem('hasSeenMexcWarning');
        if (!hasSeenWarning) {
            const timer = setTimeout(() => {
                setShowWarning(true);
                sessionStorage.setItem('hasSeenMexcWarning', 'true');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="animate-fade-in-slow">
            <MexcGrid
                settings={settings}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onKiwiTrailCellClick={handleKiwiTrailCellClick}
            />
            <HaramWarningPopup isOpen={showWarning} onClose={() => setShowWarning(false)} />
        </div>
    );
};

export default MexcScannerPage;