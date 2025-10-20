
import React, { useState, useMemo } from 'react';
import { ChannelStats, VideoStat, SortOrder } from '../types';
import { ChannelHeader } from './ChannelHeader';
import { VideoCard } from './VideoCard';
import { VideoStatsChart } from './VideoStatsChart';
import { DashboardControls } from './DashboardControls';
import { VideoFilterControls, VideoFilters } from './VideoFilterControls';
import { GrowthChart } from './GrowthChart';
import { exportToCsv } from '../utils/helpers';


interface DashboardProps {
    channelStats: ChannelStats;
    initialVideos: VideoStat[];
    sortOrder: SortOrder;
    onSortOrderChange: (order: SortOrder) => void;
    videosPerPage: number;
    onVideosPerPageChange: (value: number) => void;
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoadingMore: boolean;
    onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    channelStats, 
    initialVideos,
    sortOrder,
    onSortOrderChange,
    videosPerPage,
    onVideosPerPageChange,
    onLoadMore,
    hasNextPage,
    isLoadingMore,
    onBack
}) => {
    const [activeTab, setActiveTab] = useState<'videos' | 'growth'>('videos');
    const [filters, setFilters] = useState<VideoFilters>({
        keyword: '',
        startDate: '',
        endDate: '',
        minViews: '',
        minLikes: '',
    });

    const filteredAndSortedVideos = useMemo(() => {
        let videos = [...initialVideos];

        // Apply filters
        if (filters.keyword) {
            videos = videos.filter(v => v.title.toLowerCase().includes(filters.keyword.toLowerCase()));
        }
        if (filters.startDate) {
            videos = videos.filter(v => new Date(v.publishedAt) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            videos = videos.filter(v => new Date(v.publishedAt) <= new Date(filters.endDate));
        }
        if (filters.minViews) {
            const min = parseInt(filters.minViews, 10);
            if (!isNaN(min)) {
                videos = videos.filter(v => parseInt(v.viewCount, 10) >= min);
            }
        }
         if (filters.minLikes) {
            const min = parseInt(filters.minLikes, 10);
            if (!isNaN(min)) {
                videos = videos.filter(v => (parseInt(v.likeCount, 10) || 0) >= min);
            }
        }

        // Apply sorting
        return videos.sort((a, b) => {
            switch (sortOrder) {
                case 'viewCount':
                    return parseInt(b.viewCount, 10) - parseInt(a.viewCount, 10);
                case 'likeCount':
                    return (parseInt(b.likeCount, 10) || 0) - (parseInt(a.likeCount, 10) || 0);
                case 'date':
                default:
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            }
        });
    }, [initialVideos, filters, sortOrder]);

    const handleExport = () => {
        const filename = `YouTube_Videos_${channelStats.title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        const dataToExport = filteredAndSortedVideos.map(video => ({
            videoId: video.id,
            publishedAt: video.publishedAt,
            title: video.title,
            views: parseInt(video.viewCount, 10),
            likes: parseInt(video.likeCount, 10) || 0,
            comments: parseInt(video.commentCount, 10) || 0,
            url: `https://www.youtube.com/watch?v=${video.id}`,
        }));
        exportToCsv(filename, dataToExport);
    };


    return (
        <div className="w-full max-w-7xl mx-auto mt-2 space-y-8">
            <div className="flex items-center">
                <button 
                    onClick={onBack}
                    className="flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to All Channels
                </button>
            </div>
            <ChannelHeader stats={channelStats} />

             <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`${
                            activeTab === 'videos'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                    >
                        Latest Videos
                    </button>
                    <button
                         onClick={() => setActiveTab('growth')}
                         className={`${
                            activeTab === 'growth'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
                    >
                        Growth Chart
                    </button>
                </nav>
            </div>
            
            {activeTab === 'videos' && (
                <>
                    {initialVideos.length > 0 ? (
                        <>
                            <VideoStatsChart videos={filteredAndSortedVideos} />
                            
                            <VideoFilterControls filters={filters} onFilterChange={setFilters} />

                            <DashboardControls 
                                sortOrder={sortOrder}
                                onSortOrderChange={onSortOrderChange}
                                videosPerPage={videosPerPage}
                                onVideosPerPageChange={onVideosPerPageChange}
                                onExport={handleExport}
                                exportDisabled={filteredAndSortedVideos.length === 0}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredAndSortedVideos.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>

                            {hasNextPage && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="text-center py-16 px-6 bg-gray-800/50 rounded-lg">
                            <h3 className="text-2xl font-bold text-white">No Videos Found</h3>
                            <p className="text-gray-400 mt-2">This channel may not have any public videos available.</p>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'growth' && (
                <GrowthChart history={channelStats.history} />
            )}
        </div>
    );
};