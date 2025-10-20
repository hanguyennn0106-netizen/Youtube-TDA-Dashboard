
import React from 'react';
import type { SortOrder } from '../types';

interface DashboardControlsProps {
    sortOrder: SortOrder;
    onSortOrderChange: (order: SortOrder) => void;
    videosPerPage: number;
    onVideosPerPageChange: (value: number) => void;
    onExport: () => void;
    exportDisabled: boolean;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
    sortOrder,
    onSortOrderChange,
    videosPerPage,
    onVideosPerPageChange,
    onExport,
    exportDisabled
}) => {
    return (
        <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-white text-center sm:text-left">
                Latest Videos
            </h2>
            <div className="flex items-center gap-4 flex-wrap justify-center">
                 <button 
                    onClick={onExport}
                    disabled={exportDisabled}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export CSV
                </button>
                <div className="flex items-center gap-2">
                    <label htmlFor="videosPerPage" className="text-sm font-medium text-gray-300">Per page:</label>
                    <select
                        id="videosPerPage"
                        value={videosPerPage}
                        onChange={(e) => onVideosPerPageChange(parseInt(e.target.value, 10))}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="sortOrder" className="text-sm font-medium text-gray-300">Sort by:</label>
                    <select
                        id="sortOrder"
                        value={sortOrder}
                        onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="date">Latest</option>
                        <option value="viewCount">Most Views</option>
                        <option value="likeCount">Most Likes</option>
                    </select>
                </div>
            </div>
        </div>
    );
};