
import React from 'react';

export interface VideoFilters {
    keyword: string;
    startDate: string;
    endDate: string;
    minViews: string;
    minLikes: string;
}

interface VideoFilterControlsProps {
    filters: VideoFilters;
    onFilterChange: (filters: VideoFilters) => void;
}

export const VideoFilterControls: React.FC<VideoFilterControlsProps> = ({ filters, onFilterChange }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, [e.target.name]: e.target.value });
    };

    const handleClearFilters = () => {
        onFilterChange({
            keyword: '',
            startDate: '',
            endDate: '',
            minViews: '',
            minLikes: '',
        });
    };
    
    const hasActiveFilters = Object.values(filters).some(val => val !== '');

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Filter Videos</h3>
                 {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Keyword Search */}
                <div className="lg:col-span-2">
                    <label htmlFor="keyword" className="block text-sm font-medium text-gray-300 mb-1">Title Keyword</label>
                    <input
                        type="text"
                        name="keyword"
                        id="keyword"
                        value={filters.keyword}
                        onChange={handleInputChange}
                        placeholder="e.g., 'Tutorial'"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* Date Range */}
                <div className="md:col-span-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">Published After</label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={filters.startDate}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 <div className="md:col-span-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">Published Before</label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={filters.endDate}
                        onChange={handleInputChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 {/* Min Views */}
                <div className="md:col-span-1 lg:col-span-1/2">
                    <label htmlFor="minViews" className="block text-sm font-medium text-gray-300 mb-1">Min Views</label>
                    <input
                        type="number"
                        name="minViews"
                        id="minViews"
                        value={filters.minViews}
                        onChange={handleInputChange}
                        placeholder="10000"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* Min Likes */}
                 <div className="md:col-span-1 lg:col-span-1/2">
                    <label htmlFor="minLikes" className="block text-sm font-medium text-gray-300 mb-1">Min Likes</label>
                    <input
                        type="number"
                        name="minLikes"
                        id="minLikes"
                        value={filters.minLikes}
                        onChange={handleInputChange}
                        placeholder="1000"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
};
