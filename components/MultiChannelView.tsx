import React from 'react';
import { TrackedChannelCard } from './TrackedChannelCard';
import { GroupsView } from './GroupsView';
import { ChannelInput } from './ChannelInput';
import type { ChannelStats, ChannelGroup } from '../types';

type SortKey = 'title' | 'subscriberCount' | 'videoCount' | 'viewCount';
type SortDirection = 'asc' | 'desc';

interface MultiChannelViewProps {
    trackedChannels: ChannelStats[];
    groups: ChannelGroup[];
    sortConfig: { key: SortKey; direction: SortDirection };
    onSortChange: (config: { key: SortKey; direction: SortDirection }) => void;
    onAddChannel: (channelInput: string) => void;
    onSelectChannel: (channelId: string) => void;
    onRemoveChannel: (channelId: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    onSelectGroup: (groupId: string) => void;
    onEditGroup: (group: ChannelGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    onCreateGroup: () => void;
    isAdding: boolean;
    apiKeySet: boolean;
}

export const MultiChannelView: React.FC<MultiChannelViewProps> = ({
    trackedChannels,
    groups,
    sortConfig,
    onSortChange,
    onAddChannel,
    onSelectChannel,
    onRemoveChannel,
    onRefresh,
    isRefreshing,
    onSelectGroup,
    onEditGroup,
    onDeleteGroup,
    onCreateGroup,
    isAdding,
    apiKeySet,
}) => {
    
    const handleSortKeyChange = (key: SortKey) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
        onSortChange({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'desc' ? '▼' : '▲';
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-12">
            
            <ChannelInput 
                onAddChannel={onAddChannel}
                isDisabled={!apiKeySet || isAdding}
                isAdding={isAdding}
            />
            
            <GroupsView
                groups={groups}
                channels={trackedChannels}
                onSelectGroup={onSelectGroup}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
                onCreateGroup={onCreateGroup}
            />

            <div>
                 <div className="flex justify-between items-center mb-6 border-b-2 border-gray-700 pb-2">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-white">Tracked Channels</h2>
                        <button 
                            onClick={onRefresh} 
                            disabled={isRefreshing || trackedChannels.length === 0}
                            className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Refresh all channels"
                            title="Refresh all channels"
                        >
                            {isRefreshing ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Sort by:</span>
                        <button onClick={() => handleSortKeyChange('subscriberCount')} className={`px-2 py-1 rounded ${sortConfig.key === 'subscriberCount' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Subs {getSortIndicator('subscriberCount')}</button>
                        <button onClick={() => handleSortKeyChange('videoCount')} className={`px-2 py-1 rounded ${sortConfig.key === 'videoCount' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Videos {getSortIndicator('videoCount')}</button>
                        <button onClick={() => handleSortKeyChange('title')} className={`px-2 py-1 rounded ${sortConfig.key === 'title' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Name {getSortIndicator('title')}</button>
                    </div>
                </div>
                {trackedChannels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {trackedChannels.map(channel => (
                            <TrackedChannelCard 
                                key={channel.id} 
                                channel={channel} 
                                onSelect={onSelectChannel}
                                onRemove={onRemoveChannel}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-gray-800/50 rounded-lg">
                        <h3 className="text-2xl font-bold text-white">Welcome to your Dashboard!</h3>
                        <p className="text-gray-400 mt-2">
                            You are not tracking any channels yet.
                            <br />
                            Use the form above to add your first channel.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};