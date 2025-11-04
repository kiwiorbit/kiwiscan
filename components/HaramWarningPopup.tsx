import React, { useEffect, useRef } from 'react';

interface HaramWarningPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const HaramWarningPopup: React.FC<HaramWarningPopupProps> = ({ isOpen, onClose }) => {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    }, [isOpen, onClose]);
    
    // Handler for clicks outside the popup content
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 popup-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
        >
            <div
                ref={popupRef}
                className="popup-container relative w-full max-w-sm p-6 text-center bg-dark-card rounded-2xl shadow-2xl border border-dark-border/50 text-light-text overflow-hidden"
            >
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-dark-bg border-2 border-primary/50 shadow-lg shadow-primary/20">
                     <i className="fa-solid fa-lightbulb text-3xl text-primary"></i>
                </div>

                <h2 id="popup-title" className="text-xl font-bold mb-2">
                    A Gentle Reminder
                </h2>

                <p className="text-sm text-medium-text mb-6">
                    As you explore new opportunities, remember to trade with wisdom and clarity. Avoid tokens that may be Haram or lack genuine utility.
                    <br/><br/>
                    May your ventures be blessed and prosperous.
                </p>

                <button
                    onClick={onClose}
                    className="w-full px-6 py-2.5 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-dark-card"
                >
                    I Understand
                </button>
            </div>
        </div>
    );
};

export default HaramWarningPopup;