

import React, { useMemo, memo } from 'react';
import { 
    type Settings, 
    type KiwiTrailRowData,
    type SortKey,
    type SortDirection,
    type Timeframe,
} from '../../types';
import { TOGGLEABLE_COLUMNS } from '../../constants';
import KiwiTrailRow from './KiwiTrailRow';
import KiwiTrailRowSkeleton from './KiwiTrailRowSkeleton';
import SortableHeader from './SortableHeader';

interface KiwiTrailTableProps {
    loading: boolean;
    data: KiwiTrailRowData[];
    symbols: string[];
    settings: Settings;
    favorites: string[];
    onToggleFavorite: (symbol: string) => void;
    sortConfig: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    onKiwiTrailCellClick: (symbol: string, timeframe: Timeframe) => void;
}

const KiwiTrailTable: React.FC<KiwiTrailTableProps> = ({
    loading,
    data,
    symbols,
    settings,
    favorites,
    onToggleFavorite,
    sortConfig,
    onSort,
    onKiwiTrailCellClick,
}) => {
    const visibleColumns = useMemo(() => settings.visibleColumns, [settings.visibleColumns]);

    const visibleColumnCount = useMemo(() => {
        const fixedColumns = 2; // Symbol, Price
        const toggledVisible = Object.values(visibleColumns).filter(v => v).length;
        return fixedColumns + toggledVisible;
    }, [visibleColumns]);

    const renderHeader = (key: string, label: string, sortKey: SortKey) => {
        if (!visibleColumns[key]) return null;
        return (
            <th scope="col" className="px-2 py-2 sm:py-3 text-center">
                <SortableHeader sortKey={sortKey} label={label} sortConfig={sortConfig} onSort={onSort} className="w-full justify-center"/>
            </th>
        );
    };

    return (
        <div className="overflow-x-auto rounded-2xl border border-dark-border/30">
             <table className="min-w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-dark-bg sticky top-0 z-20">
                    <tr className="border-b-2 border-dark-border">
                        <th scope="col" className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-30 w-30 text-center border-r border-dark-border/50"><SortableHeader sortKey="symbol" label="Symbol" sortConfig={sortConfig} onSort={onSort} className="w-full justify-center"/></th>
                        <th scope="col" className="px-2 py-2 sm:py-3 text-center"><SortableHeader sortKey="price" label="Price" sortConfig={sortConfig} onSort={onSort} className="w-full justify-center" /></th>
                        {TOGGLEABLE_COLUMNS.map(({ key, label }) => {
                            if (key.startsWith('kt-') || key.startsWith('hl-')) {
                                if (!visibleColumns[key]) return null;
                                const tfLabel = label.split(' - ')[1];
                                return (
                                    <th scope="col" key={key} className="px-2 py-2 sm:py-3 text-center">
                                        <SortableHeader sortKey={key as SortKey} label={tfLabel} sortConfig={sortConfig} onSort={onSort} className="w-full justify-center"/>
                                    </th>
                                );
                            }
                            if (key === 'dailyVwap') {
                                if (!visibleColumns[key]) return null;
                                return <th key={key} scope="col" className="px-2 py-2 sm:py-3 text-center">{label}</th>;
                            }
                            return renderHeader(key, label, key as SortKey);
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {loading && data.length === 0 ? (
                        Array.from({ length: Math.min(symbols.length, 20) || 15 }).map((_, i) => <KiwiTrailRowSkeleton key={i} visibleColumns={visibleColumns} />)
                    ) : (
                        data.map(rowData => (
                            <KiwiTrailRow
                                key={rowData.symbol}
                                rowData={rowData}
                                onKiwiTrailCellClick={onKiwiTrailCellClick}
                                isFavorite={favorites.includes(rowData.symbol)}
                                onToggleFavorite={onToggleFavorite}
                                settings={settings}
                                visibleColumns={visibleColumns}
                            />
                        ))
                    )}
                    {!loading && data.length === 0 && (
                        <tr>
                            <td colSpan={visibleColumnCount} className="text-center py-16">
                                <i className="fa-solid fa-table-list text-4xl mb-4"></i>
                                <p>No symbols to display.</p>
                                <p className="text-sm">Please add symbols to your Asset List in the settings.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default memo(KiwiTrailTable);