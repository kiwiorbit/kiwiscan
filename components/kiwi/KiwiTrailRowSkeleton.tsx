import React from 'react';

const KiwiTrailRowSkeleton: React.FC<{ visibleColumns: { [key: string]: boolean } }> = ({ visibleColumns }) => (
    <tr className="animate-pulse h-[52px]">
        <td className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-10 border-r border-dark-border/50">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-dark-border rounded-md"></div>
                <div className="h-4 w-24 bg-dark-border rounded"></div>
            </div>
        </td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>
        {visibleColumns['change24h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['change15m'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['kt-5m'] && <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['kt-15m'] && <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['kt-1h'] && <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['kt-4h'] && <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['dailyVwap'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-4 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['ticks5m'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['spotVolume1h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['delta15m'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['delta1h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['cvd15m'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['cvd1h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['oiChange4h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['oiChange8h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['fundingRate'] && <td className="px-2 py-2 sm:py-3"><div className="w-2.5 h-2.5 bg-dark-border rounded-full mx-auto"></div></td>}
        {visibleColumns['vsBtc1h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
        {visibleColumns['rsi4h'] && <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>}
    </tr>
);

export default KiwiTrailRowSkeleton;