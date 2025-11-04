import React from 'react';

const MexcRowSkeleton: React.FC = () => (
    <tr className="animate-pulse h-[52px]">
        <td className="px-2 py-2 sm:py-3 sticky left-0 bg-dark-bg z-10 border-r border-dark-border/50">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-dark-border rounded-md"></div>
                <div className="h-4 w-24 bg-dark-border rounded"></div>
            </div>
        </td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-16 bg-dark-border rounded mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="w-3 h-3 bg-dark-border rounded-full mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-4 bg-dark-border rounded-full mx-auto"></div></td>
        <td className="px-2 py-2 sm:py-3"><div className="h-4 w-12 bg-dark-border rounded mx-auto"></div></td>
    </tr>
);

export default MexcRowSkeleton;