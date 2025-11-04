import React, { useMemo } from 'react';

interface AlertLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    alertLog: Record<string, any>;
    onClearLog: () => void;
}

interface ParsedLogEntry {
    uniqueId: string;
    timestamp: number;
    symbol: string;
    timeframe: string;
    alertType: string;
}

const AlertLogModal: React.FC<AlertLogModalProps> = ({ isOpen, onClose, alertLog, onClearLog }) => {
    
    const parsedLog = useMemo(() => {
        return Object.entries(alertLog)
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
            .map(([key, timestamp]) => {
                const parts = key.split('-');
                const lastPart = parts[parts.length - 1];
                
                // Check if last part is a timestamp for event-based alerts
                if (!isNaN(parseInt(lastPart, 10)) && new Date(parseInt(lastPart, 10)).getTime() > 0) {
                     return {
                        uniqueId: key.replace('luxalgo', 'Kiwitrail'),
                        timestamp: timestamp, // The value is the fire time
                        symbol: parts[0],
                        timeframe: parts[1],
                        alertType: parts.slice(2, -1).join('-').replace('luxalgo', 'Kiwitrail')
                    };
                } else {
                    // State-based alert (no timestamp in key)
                    return {
                        uniqueId: key.replace('luxalgo', 'Kiwitrail'),
                        timestamp: timestamp,
                        symbol: parts[0],
                        timeframe: parts[1],
                        alertType: parts.slice(2).join('-').replace('luxalgo', 'Kiwitrail')
                    };
                }
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent
    }, [alertLog]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-dark-bg/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[800px] flex flex-col border border-dark-border/50">
                <div className="flex justify-between items-center p-4 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-light-text">Alert Log Registry</h2>
                    <button onClick={onClose} className="text-2xl text-medium-text hover:text-light-text transition-colors" aria-label="Close alert log">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {parsedLog.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center text-medium-text">
                            <div>
                                <i className="fa-solid fa-clipboard-question text-5xl mb-4 opacity-70"></i>
                                <p>No alerts have been logged yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                             <table className="w-full text-sm text-left text-medium-text">
                                <thead className="text-xs uppercase bg-dark-card/80">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Timestamp</th>
                                        <th scope="col" className="px-6 py-3">Symbol</th>
                                        <th scope="col" className="px-6 py-3">Timeframe</th>
                                        <th scope="col" className="px-6 py-3">Alert Type</th>
                                        <th scope="col" className="px-6 py-3">Unique ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedLog.map((entry) => (
                                        <tr key={entry.uniqueId} className="border-b border-dark-border hover:bg-dark-border/50">
                                            <td className="px-6 py-4 font-mono">{new Date(entry.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-semibold text-light-text">{entry.symbol}</td>
                                            <td className="px-6 py-4">{entry.timeframe}</td>
                                            <td className="px-6 py-4">{entry.alertType}</td>
                                            <td className="px-6 py-4 font-mono text-xs truncate max-w-xs" title={entry.uniqueId}>{entry.uniqueId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center p-4 border-t border-dark-border">
                    <button
                        onClick={onClearLog}
                        className="px-4 py-2 font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={parsedLog.length === 0}
                    >
                        Clear Log
                    </button>
                    <button onClick={onClose} className="px-6 py-2 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertLogModal;