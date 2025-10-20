
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyManager } from './components/ApiKeyManager';
import { MultiChannelView } from './components/MultiChannelView';
import { Dashboard } from './components/Dashboard';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorDisplay } from './components/ErrorDisplay';
import { GroupSettingsModal } from './components/GroupSettingsModal';
import { TopBar } from './components/TopBar';
import { getChannelStats, getChannelVideos, getOldestVideo, setApiKeys, getChannelStatsForDateRange, getNewestVideoInRange, getOldestVideoInRange, validateYouTubeApiKey, setOnKeyIndexChange, setOnQuotaChange, getInitialQuota } from './services/youtubeService';
import { extractChannelId, getTodaysDateString } from './utils/helpers';
import type { ChannelStats, VideoStat, SortOrder, ChannelGroup, ChannelComparisonData, ApiKey, DailyMetric } from './types';

// Define the shape of a selected channel's full data
interface SelectedChannelData {
    stats: ChannelStats;
    videos: VideoStat[];
    nextPageToken?: string;
}

const DEFAULT_API_KEYS = [
    'AIzaSyAXKwtLZ5umlg3Q8EhyUHXOHVRU7wzqqo4',
    'AIzaSyDjVs6HKSh6s-BY7TNGdcWBam9pxHL0FrM',
    'AIzaSyCiHjZSec4JRrjyCBV8TqywB6-htZQveh0',
    'AIzaSyB_BpGTbk-M10vvhWHa5YbKYDBrg5ZMLms',
    'AIzaSyA_zL9IdgcYE8KXhbaLA4l80ye5QeadV9M',
    'AIzaSyC9fpN16D4iIlfl9eRfE-ktZ3KCmGXHzr4',
    'AIzaSyCjDDy8dg4kb3yBFi4z9p6sP1JhS3dZWp8',
    'AIzaSyDPmWPouVbLJG9MqfTWCejjJeHDa2T1CyM',
    'AIzaSyAYRBnRv9LhIyzJZS0Y_NRRWhTWvLgxoXc',
    'AIzaSyBgBasK0CYPpQyPDBvkfjcee9iTVMoDDpU',
    'AIzaSyBmer2t7PWmzy_VPl3imZbhQtp8qNecMfU',
    'AIzaSyBwzhP37j2Zl1rNn0jVhm6eHz3L1a1E5yc',
    'AIzaSyAoq5OFdL5vrrv5lmK_b3eYSX8JHPYJ01Y',
    'AIzaSyBloaY5QRD2pNT34KVnUdIyP1hW8GoWfDk',
    'AIzaSyCvAhdgqocLRzrTUtQRMrj_El2GEcmh6tM',
    'AIzaSyBS4XeSsv1DLJGwbiMxztRo1F286GGLrDo',
    'AIzaSyB4_VkCa9bk74sZKxOy6_x5Y479q5PhmyY',
    'AIzaSyDCRb0ow6V426AGQgbKAoXV-4lEzm689zE',
    'AIzaSyCINnUzSYLU9CzJwrkvCZXocXLZxPUHWYw',
    'AIzaSyC6BYYEv90BxAQOhYW508b7yO21sJIrAdE',
    'AIzaSyCn7TUIz2uEPwWG-gvBuPI1ImOtjbjSecI',
    'AIzaSyCOfWOwD8aBx8saCkFjL_8afhLYI8xVI-U',
    'AIzaSyD2jPJJMwAOMAbgJnrUWt4xKmTqv4eHlpg',
    'AIzaSyCNcW3btAWCmxWqfSVouRJQkPonhzRpO_M',
    'AIzaSyAjSyckVL0QWmy6xANTF5uL5n_BFtg3hhg',
    'AIzaSyD8lVhKaeBDQi5I3147aqUMB6m831mxQjE',
    'AIzaSyBOvwHJEaum9jzjTWe2tVRPWEjgnRO4PuY',
    'AIzaSyBXbXLIbB7gZzBw_ZVxAidHQS96WZcDYp8',
    'AIzaSyC59InKnFOkFSoaopK7wec1LQLQWMvX9W4',
    'AIzaSyA4QKf2bbAbhJyKv2EA8vFJ01kXqv3qF2Y',
    'AIzaSyD23AvOA7Dw8GKWgvmXvNiU7Wh6PXm2e5A',
    'AIzaSyDhzIukSl4Pes-plYRtMnyFTGCGPN5blyQ',
    'AIzaSyBj0mPJkGHKCoFkjTwNL3RlOKTJ-SV14nA',
    'AIzaSyDR7Hn4fi3aLFij2QTFHTzzLq9qg1aE8Vs',
    'AIzaSyA6N8osBdlu5Nw7iayjrf8ZvCvyQEdJmYg',
    'AIzaSyCKqyq5ZsIRInsf23wALLax_PH-v7f3KL0',
    'AIzaSyCj9nrUPrRZgwJsCbIzz1xeXVqx4GRrwCU',
    'AIzaSyAwrTI41HsZI70-e8_4aGVtZ2afqlo6KbI',
    'AIzaSyBW75Sv9Epf4BUu2iT_JSdpIXdSqK7C5Pg',
    'AIzaSyDQn-ZWkc6GLpBRxJ8TlFTRP9V5DngigSU',
    'AIzaSyCF5hJ4iLikCaLR6xAst4-lIU4TfDBupNo',
    'AIzaSyAktkelfVcWzQahjMnQzXLdD0UkZIpZzdE',
    'AIzaSyB04qQwr93Lz2Q71yCp_E7bgXJar4LUcOA',
    'AIzaSyAKz4D4-P6zVqBgLS3cGUxw8kiVDr4g9pU',
    'AIzaSyCMqoBF3DOwyxqgtfQSrykHs5rWqdhOTkU',
    'AIzaSyBRztAkUBKRIU6rQzlIv64O_hQ7PP8tsZU',
    'AIzaSyBu0Tc1XBrIp0eiEGX-HaJxXyOOr6J04AQ',
    'AIzaSyB7MDT99e553kTcIkuCH1rdvxI90hFwX2c',
    'AIzaSyAkVerjaO1MN4UPhdN0VgZ9n8z_fA0VpKM',
];


type TrackedSortKey = 'title' | 'subscriberCount' | 'videoCount' | 'viewCount';

const App: React.FC = () => {
    // Core State
    const [apiKeys, setApiKeysState] = useState<ApiKey[]>([]);
    const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
    const [trackedChannels, setTrackedChannels] = useState<ChannelStats[]>([]);
    const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<SelectedChannelData | null>(null);
    const [comparisonData, setComparisonData] = useState<ChannelComparisonData[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ChannelGroup | null>(null);
    const [view, setView] = useState<'multi' | 'single' | 'comparison'>('multi');
    const [quotaUsage, setQuotaUsage] = useState(getInitialQuota());

    const dailyQuotaLimit = useMemo(() => {
        const validKeysCount = apiKeys.filter(k => k.status === 'valid').length;
        if (validKeysCount > 0) {
            return validKeysCount * 10000;
        }
        // If no keys are valid, but some exist (e.g., checking, unknown), show their potential total.
        if (apiKeys.length > 0) {
            return apiKeys.length * 10000;
        }
        // Fallback for when no keys are added at all.
        return 10000;
    }, [apiKeys]);


    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingChannel, setIsAddingChannel] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingComparison, setIsLoadingComparison] = useState(false);
    const [error, setError] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);

    // Dashboard State
    const [sortOrder, setSortOrder] = useState<SortOrder>('date');
    const [videosPerPage, setVideosPerPage] = useState<number>(12);
    const [comparisonDateRange, setComparisonDateRange] = useState<{ start: string; end: string } | null>(null);
    const [trackedSortConfig, setTrackedSortConfig] = useState<{ key: TrackedSortKey, direction: 'asc' | 'desc' }>({ key: 'subscriberCount', direction: 'desc' });
    const [isHighQuotaFeaturesEnabled, setIsHighQuotaFeaturesEnabled] = useState(false);

    // API Key validation logic
    const validateKeys = useCallback(async (keysToValidate: string[]) => {
        for (const key of keysToValidate) {
            setApiKeysState(prev => prev.map(k => k.value === key ? { ...k, status: 'checking' } : k));
            const result = await validateYouTubeApiKey(key);
            setApiKeysState(prev => prev.map(k =>
                k.value === key
                ? { ...k, status: result.status, error: result.error }
                : k
            ));
        }
    }, []);

    // Load settings from localStorage on initial mount
    useEffect(() => {
        try {
            const savedApiKeys = localStorage.getItem('youtubeApiKeys');
            const parsedKeys: string[] = savedApiKeys ? JSON.parse(savedApiKeys) : DEFAULT_API_KEYS;
            
            if (parsedKeys.length > 0) {
                 const initialApiKeys: ApiKey[] = parsedKeys.map(value => ({ value, status: 'unknown' }));
                 setApiKeysState(initialApiKeys);
            } else {
                 setIsSettingsOpen(true);
            }

            const savedChannels = localStorage.getItem('youtubeTrackedChannels');
            if (savedChannels) {
                const parsed = JSON.parse(savedChannels);
                const parsedChannels = parsed.map((c: any, index: number) => ({
                    ...c,
                    history: c.history || [], // Ensure history array exists
                     // Backfill `addedAt` using index to preserve original add order for sorting
                    addedAt: c.addedAt || (Date.now() - (parsed.length - index) * 60000)
                }));
                setTrackedChannels(parsedChannels);
            }
            
            const savedGroups = localStorage.getItem('youtubeChannelGroups');
            if (savedGroups) setChannelGroups(JSON.parse(savedGroups));

            const savedVideosPerPage = localStorage.getItem('youtubeVideosPerPage');
            if (savedVideosPerPage) setVideosPerPage(parseInt(savedVideosPerPage, 10));

            const savedHighQuota = localStorage.getItem('youtubeHighQuotaEnabled');
            if (savedHighQuota) setIsHighQuotaFeaturesEnabled(JSON.parse(savedHighQuota));

        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
            setError("Could not load saved settings.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect to validate keys when the list changes
    useEffect(() => {
        const keyStrings = apiKeys.map(k => k.value);
        if (keyStrings.length > 0) {
            setApiKeys(keyStrings);
        }
        
        const keysToValidate = apiKeys.filter(k => k.status === 'unknown').map(k => k.value);
        if (keysToValidate.length > 0) {
            validateKeys(keysToValidate);
        }
    }, [apiKeys, validateKeys]);

    // Effect to subscribe to key index and quota changes from the service
    useEffect(() => {
        setOnKeyIndexChange(setCurrentKeyIndex);
        setOnQuotaChange(setQuotaUsage);
    }, []);
    
    // Handlers for settings
    const handleApiKeysChange = (newKeyStrings: string[]) => {
        const newApiKeys: ApiKey[] = newKeyStrings.map(value => {
            const existing = apiKeys.find(k => k.value === value);
            return existing || { value, status: 'unknown' };
        });
        setApiKeysState(newApiKeys);
        localStorage.setItem('youtubeApiKeys', JSON.stringify(newKeyStrings));
    };

    const handleRevalidateAllKeys = () => {
        validateKeys(apiKeys.map(k => k.value));
    };
    
    const handleVideosPerPageChange = (newValue: number) => {
        setVideosPerPage(newValue);
        localStorage.setItem('youtubeVideosPerPage', String(newValue));
    };
    
    const handleHighQuotaToggle = (isEnabled: boolean) => {
        setIsHighQuotaFeaturesEnabled(isEnabled);
        localStorage.setItem('youtubeHighQuotaEnabled', JSON.stringify(isEnabled));
    };

    // Handlers for channel management
    const handleAddChannel = useCallback(async (channelInput: string) => {
        if (apiKeys.length === 0) {
            setError('Please set your YouTube Data API key(s) in Settings first.');
            setIsSettingsOpen(true);
            return;
        }

        const identifiers = channelInput.split('\n').map(s => s.trim()).filter(Boolean);
        if (identifiers.length === 0) return;

        setIsAddingChannel(true);
        setError('');

        const newChannels: ChannelStats[] = [];
        const errors: string[] = [];
        
        const existingIds = new Set(trackedChannels.map(c => c.id));

        for (const identifier of identifiers) {
            try {
                const channelIdentifier = extractChannelId(identifier);
                if (!channelIdentifier) {
                    errors.push(`Invalid format: ${identifier}`);
                    continue;
                }
                
                const stats = await getChannelStats(channelIdentifier);
                if (existingIds.has(stats.id) || newChannels.some(c => c.id === stats.id)) {
                    continue;
                }
                
                const today = getTodaysDateString();
                const newChannelWithHistory: ChannelStats = {
                    ...stats,
                    addedAt: Date.now(),
                    history: [{
                        date: today,
                        subscriberCount: stats.subscriberCount,
                        viewCount: stats.viewCount,
                        videoCount: stats.videoCount,
                    }]
                };
                newChannels.push(newChannelWithHistory);

            } catch (err: any) {
                console.error(`Failed to fetch channel '${identifier}':`, err);
                errors.push(`'${identifier}': ${err.message || 'An unknown error occurred.'}`);
            }
        }

        if (newChannels.length > 0) {
            const updatedChannels = [...trackedChannels, ...newChannels];
            setTrackedChannels(updatedChannels);
            localStorage.setItem('youtubeTrackedChannels', JSON.stringify(updatedChannels));
        }

        if (errors.length > 0) {
            setError(`Could not add all channels:\n- ${errors.join('\n- ')}`);
        }

        setIsAddingChannel(false);
    }, [apiKeys, trackedChannels]);

    const handleRemoveChannel = (channelId: string) => {
        const updatedChannels = trackedChannels.filter(c => c.id !== channelId);
        setTrackedChannels(updatedChannels);
        localStorage.setItem('youtubeTrackedChannels', JSON.stringify(updatedChannels));

        const updatedGroups = channelGroups.map(g => ({
            ...g,
            channelIds: g.channelIds.filter(id => id !== channelId)
        }));
        setChannelGroups(updatedGroups);
        localStorage.setItem('youtubeChannelGroups', JSON.stringify(updatedGroups));
    };

    const handleRefreshChannels = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setError('');
        
        // Make a mutable copy of the channels to update.
        let updatedChannels = JSON.parse(JSON.stringify(trackedChannels));
        const today = getTodaysDateString();
        let refreshErrors: string[] = [];

        for (let i = 0; i < updatedChannels.length; i++) {
            const channel = updatedChannels[i];
            try {
                const newStats = await getChannelStats(channel.id);
                
                const newMetric: DailyMetric = {
                    date: today,
                    subscriberCount: newStats.subscriberCount,
                    viewCount: newStats.viewCount,
                    videoCount: newStats.videoCount,
                };
                
                const lastHistory = channel.history[channel.history.length - 1];

                if (lastHistory && lastHistory.date === today) {
                    // Update today's record
                    channel.history[channel.history.length - 1] = newMetric;
                } else {
                    // Add a new record for today
                    channel.history.push(newMetric);
                }
                
                // Update the main stats on the channel object as well
                updatedChannels[i] = { ...channel, ...newStats, history: channel.history };

            } catch (err: any) {
                console.error(`Failed to refresh channel '${channel.title}':`, err);
                refreshErrors.push(channel.title);
            }
        }

        setTrackedChannels(updatedChannels);
        localStorage.setItem('youtubeTrackedChannels', JSON.stringify(updatedChannels));
        
        if (refreshErrors.length > 0) {
            setError(`Could not refresh some channels: ${refreshErrors.join(', ')}.`);
        }

        setIsRefreshing(false);
    }, [trackedChannels, isRefreshing]);
    
    const handleSelectChannel = useCallback(async (channelId: string) => {
        const stats = trackedChannels.find(c => c.id === channelId);
        if (!stats) return;
        
        setView('single');
        setIsLoadingVideos(true);
        setError('');
        setSelectedChannel(null);
        setSortOrder('date');
        
        try {
            const videoData = await getChannelVideos(stats.uploadsPlaylistId, videosPerPage);
            setSelectedChannel({
                stats,
                videos: videoData.videos,
                nextPageToken: videoData.nextPageToken
            });
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setView('multi');
        } finally {
            setIsLoadingVideos(false);
        }
    }, [trackedChannels, videosPerPage]);

    // Group Handlers
    const handleOpenGroupModal = (group: ChannelGroup | null = null) => {
        setEditingGroup(group);
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = (groupData: Omit<ChannelGroup, 'id'> & { id?: string }) => {
        let updatedGroups;
        if (groupData.id) { // Editing existing group
            updatedGroups = channelGroups.map(g => g.id === groupData.id ? { ...g, name: groupData.name, channelIds: groupData.channelIds } : g);
        } else { // Creating new group
            const newGroup: ChannelGroup = {
                id: `group-${Date.now()}`,
                name: groupData.name,
                channelIds: groupData.channelIds
            };
            updatedGroups = [...channelGroups, newGroup];
        }
        setChannelGroups(updatedGroups);
        localStorage.setItem('youtubeChannelGroups', JSON.stringify(updatedGroups));
    };

    const handleDeleteGroup = (groupId: string) => {
        const updatedGroups = channelGroups.filter(g => g.id !== groupId);
        setChannelGroups(updatedGroups);
        localStorage.setItem('youtubeChannelGroups', JSON.stringify(updatedGroups));
    };

    const handleSelectGroup = useCallback(async (groupId: string, dateRange: { start: string, end: string} | null = null) => {
        const group = channelGroups.find(g => g.id === groupId);
        if (!group) return;

        setView('comparison');
        setIsLoadingComparison(true);
        setError('');
        setSelectedGroup(group);
        setComparisonData([]);
        setComparisonDateRange(dateRange);

        try {
            const groupChannels = trackedChannels.filter(c => group.channelIds.includes(c.id));

            const dataPromises = groupChannels.map(async (channel): Promise<ChannelComparisonData> => {
                 const [
                    newestVideo,
                    oldestVideo,
                    dateRangeStats
                ] = await Promise.all([
                    getNewestVideoInRange(channel.id, channel.uploadsPlaylistId, dateRange?.start, dateRange?.end),
                    getOldestVideoInRange(channel.uploadsPlaylistId, dateRange?.start, dateRange?.end),
                    dateRange ? getChannelStatsForDateRange(channel.id, dateRange.start, dateRange.end) : Promise.resolve(null),
                ]);

                return {
                    ...channel,
                    // If we have date range stats, override the total counts
                    viewCount: dateRangeStats?.viewCount ?? channel.viewCount,
                    videoCount: dateRangeStats?.videoCount ?? channel.videoCount,
                    newestVideo: newestVideo || null,
                    oldestVideo: oldestVideo || null,
                };
            });
            
            const results = await Promise.all(dataPromises);
            setComparisonData(results);

        } catch (err: any) {
            console.error("Failed to fetch comparison data:", err);
            setError(err.message || "An error occurred while fetching comparison data.");
            setView('multi');
        } finally {
            setIsLoadingComparison(false);
        }
    }, [channelGroups, trackedChannels]);


    const handleBackToMultiView = () => {
        setView('multi');
        setSelectedChannel(null);
        setComparisonData([]);
        setSelectedGroup(null);
        setComparisonDateRange(null);
        setError('');
    };
    
    const handleLoadMore = async () => {
        if (!selectedChannel || !selectedChannel.nextPageToken || isLoadingMore) return;
        
        setIsLoadingMore(true);
        setError('');
        try {
            const videoData = await getChannelVideos(selectedChannel.stats.uploadsPlaylistId, videosPerPage, selectedChannel.nextPageToken);
            setSelectedChannel(prevData => prevData ? {
                ...prevData,
                videos: [...prevData.videos, ...videoData.videos],
                nextPageToken: videoData.nextPageToken
            } : null);
        } catch (err: any)
        {
            setError(err.message || 'An unknown error occurred while loading more videos.');
        } finally {
            setIsLoadingMore(false);
        }
    };
    
    const sortedTrackedChannels = useMemo(() => {
        const { key, direction } = trackedSortConfig;
        return [...trackedChannels].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            if (key === 'title') {
                aValue = a.title.toLowerCase();
                bValue = b.title.toLowerCase();
            } else {
                aValue = parseInt(a[key], 10);
                bValue = parseInt(b[key], 10);
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [trackedChannels, trackedSortConfig]);
    
    const renderContent = () => {
        if (isLoading) return <LoadingIndicator />;

        switch(view) {
            case 'single':
                return isLoadingVideos ? <LoadingIndicator /> : selectedChannel && (
                    <Dashboard 
                        channelStats={selectedChannel.stats} 
                        initialVideos={selectedChannel.videos}
                        sortOrder={sortOrder}
                        onSortOrderChange={setSortOrder}
                        videosPerPage={videosPerPage}
                        onVideosPerPageChange={handleVideosPerPageChange}
                        onLoadMore={handleLoadMore}
                        hasNextPage={!!selectedChannel.nextPageToken}
                        isLoadingMore={isLoadingMore}
                        onBack={handleBackToMultiView}
                    />
                );
            case 'comparison':
                return isLoadingComparison ? <LoadingIndicator /> : selectedGroup && (
                    <ComparisonDashboard
                        group={selectedGroup}
                        data={comparisonData}
                        onBack={handleBackToMultiView}
                        dateRange={comparisonDateRange}
                        onDateRangeChange={(range) => handleSelectGroup(selectedGroup.id, range)}
                        isHighQuotaFeaturesEnabled={isHighQuotaFeaturesEnabled}
                        onToggleHighQuotaFeatures={handleHighQuotaToggle}
                    />
                );
            case 'multi':
            default:
                 return (
                    <MultiChannelView 
                        trackedChannels={sortedTrackedChannels}
                        groups={channelGroups}
                        sortConfig={trackedSortConfig}
                        onSortChange={setTrackedSortConfig}
                        onAddChannel={handleAddChannel}
                        onSelectChannel={handleSelectChannel}
                        onRemoveChannel={handleRemoveChannel}
                        onRefresh={handleRefreshChannels}
                        isRefreshing={isRefreshing}
                        onSelectGroup={(groupId) => handleSelectGroup(groupId)}
                        onEditGroup={(group) => handleOpenGroupModal(group)}
                        onDeleteGroup={handleDeleteGroup}
                        onCreateGroup={() => handleOpenGroupModal(null)}
                        isAdding={isAddingChannel}
                        apiKeySet={apiKeys.length > 0}
                    />
                );
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans antialiased pt-8">
            <TopBar 
                trackedChannelsCount={trackedChannels.length} 
                apiKeys={apiKeys}
                currentKeyIndex={currentKeyIndex}
                sessionQuota={quotaUsage.session}
                dailyQuota={quotaUsage.daily}
                dailyQuotaLimit={dailyQuotaLimit}
            />
            <Header onOpenSettings={() => setIsSettingsOpen(true)} />
            <main className="container mx-auto px-4 py-8 flex flex-col items-center space-y-8">
                {error && <ErrorDisplay message={error} />}
                {renderContent()}
            </main>
            <Footer />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
                <ApiKeyManager 
                    apiKeys={apiKeys}
                    onApiKeysChange={handleApiKeysChange}
                    onRevalidateAll={handleRevalidateAllKeys}
                    isDisabled={false}
                />
            </SettingsModal>
            <GroupSettingsModal 
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSave={handleSaveGroup}
                existingGroup={editingGroup}
                allChannels={trackedChannels}
            />
        </div>
    );
};

export default App;
