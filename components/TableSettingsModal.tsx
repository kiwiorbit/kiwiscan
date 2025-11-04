import React from 'react';
import { TOGGLEABLE_COLUMNS } from '../constants';

interface TableSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visibleColumns: { [key: string]: boolean };
    onColumnVisibilityChange: (key: string, value: boolean) => void;
}

const TableSettingsModal: React.FC<TableSettingsModalProps> = ({ isOpen, onClose, visibleColumns, onColumnVisibilityChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-dark-bg/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col border border-dark-border/50">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-light-text">Table Settings</h2>
                    <button onClick={onClose} className="text-2xl text-medium-text hover:text-light-text transition-colors" aria-label="Close table settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-4 overflow-y-auto">
                    <p className="text-sm text-medium-text mb-4">Select which columns to display in the table.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {TOGGLEABLE_COLUMNS.map(({ key, label }) => {
                            const id = `col-toggle-${key}`;
                            return (
                                <div key={key} className="p-2 rounded-lg bg-dark-bg/80 flex items-center justify-between">
                                    <label htmlFor={id} className="font-medium text-sm cursor-pointer pr-4 text-light-text flex-grow">
                                        {label}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            id={id}
                                            className="sr-only peer"
                                            checked={visibleColumns[key] ?? true}
                                            onChange={(e) => onColumnVisibilityChange(key, e.target.checked)}
                                        />
                                        <div className="w-10 h-5 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-dark-border">
                    <button onClick={onClose} className="px-6 py-2 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableSettingsModal;