import React from 'react';
import type { SortDirection } from '../../types';

interface SortableHeaderProps<T extends string> {
    sortKey: T;
    label: string;
    sortConfig: { key: T; direction: SortDirection };
    onSort: (key: T) => void;
    className?: string;
}

function SortableHeader<T extends string>({ sortKey, label, sortConfig, onSort, className = '' }: SortableHeaderProps<T>) {
    const isSorted = sortConfig.key === sortKey;
    const icon = isSorted ? (sortConfig.direction === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : 'fa-sort';
    return (
        <button onClick={() => onSort(sortKey)} className={`flex items-center gap-2 whitespace-nowrap ${className}`}>
            {label}
            <i className={`fa-solid ${icon} text-xs ${isSorted ? 'text-primary' : 'text-medium-text/50'}`}></i>
        </button>
    );
}

export default SortableHeader;