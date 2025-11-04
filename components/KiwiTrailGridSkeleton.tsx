import React from 'react';

const KiwiTrailGridCellSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg bg-dark-card/50 h-[60px] animate-pulse">
            <div className="col-span-4 md:col-span-6 flex items-center gap-4">
                <div className="w-6 h-6 bg-dark-border rounded-md"></div>
                <div className="h-4 w-24 bg-dark-border rounded"></div>
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-end">
                <div className="h-4 w-16 bg-dark-border rounded"></div>
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="w-5 h-5 rounded-full bg-dark-border"></div>
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="w-5 h-5 rounded-full bg-dark-border"></div>
            </div>
            <div className="col-span-1 flex justify-center">
                <div className="w-5 h-5 rounded-full bg-dark-border"></div>
            </div>
            <div className="col-span-1 flex justify-center">
                <div className="w-5 h-5 rounded-full bg-dark-border"></div>
            </div>
        </div>
    );
};

export default KiwiTrailGridCellSkeleton;
