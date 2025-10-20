
import { ChannelStats, VideoStat, KeyStatus } from '../types';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

let apiKeys: string[] = [];
let currentKeyIndex = 0;
let onKeyIndexChangeCallback: ((index: number) => void) | null = null;

// --- Quota Tracking ---
const QUOTA_COSTS: Record<string, number> = {
    'channels': 1,
    'playlistItems': 1,
    'videos': 1,
    'search': 100,
    'i18nLanguages': 1,
};

let sessionQuotaUsed = 0;
let dailyQuotaUsed = 0;
let onQuotaChangeCallback: ((quota: { session: number, daily: number }) => void) | null = null;

const initializeDailyQuota = () => {
    try {
        const storedQuota = localStorage.getItem('youtubeDailyQuota');
        const today = new Date().toISOString().split('T')[0];
        if (storedQuota) {
            const { date, used } = JSON.parse(storedQuota);
            if (date === today) {
                dailyQuotaUsed = used;
            } else {
                localStorage.removeItem('youtubeDailyQuota');
            }
        }
    } catch (e) {
        console.error("Failed to read daily quota from localStorage", e);
    }
};

initializeDailyQuota(); // Load daily quota on script start

export const setOnQuotaChange = (callback: (quota: { session: number, daily: number }) => void) => {
    onQuotaChangeCallback = callback;
};

export const getInitialQuota = () => {
    return { session: sessionQuotaUsed, daily: dailyQuotaUsed };
};

// --- End Quota Tracking ---


export const setApiKeys = (keys: string[]) => {
    apiKeys = [...keys]; // Make a copy to avoid mutation issues
    // Reset index only if it's out of bounds
    if (currentKeyIndex >= apiKeys.length) {
        currentKeyIndex = 0;
    }
};

export const setOnKeyIndexChange = (callback: (index: number) => void) => {
    onKeyIndexChangeCallback = callback;
};

/**
 * Fetches data from the YouTube API with automatic key rotation and retries.
 * It will attempt the request with each available API key until one succeeds or all fail.
 * @param endpoint The API endpoint to hit.
 * @param params The query parameters for the request.
 * @returns A promise that resolves to the JSON response.
 */
const fetchYouTubeAPI = async (endpoint: string, params: Record<string, string>): Promise<any> => {
    if (apiKeys.length === 0) {
        throw new Error('Please configure at least one YouTube Data API key in Settings.');
    }
    
    const cost = QUOTA_COSTS[endpoint] || 1; // Default cost to 1 if not specified
    const startIndex = currentKeyIndex;
    let lastError: Error | null = null;

    for (let i = 0; i < apiKeys.length; i++) {
        const keyIndex = (startIndex + i) % apiKeys.length;
        const apiKey = apiKeys[keyIndex];

        try {
            const query = new URLSearchParams({ ...params, key: apiKey }).toString();
            const response = await fetch(`${API_BASE_URL}/${endpoint}?${query}`);

            if (!response.ok) {
                const errorData = await response.json();
                const reason = errorData.error?.errors?.[0]?.reason;
                const message = errorData.error?.message || 'An unknown API error occurred.';
                lastError = new Error(message);
                
                if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
                    console.warn(`API key ending in ...${apiKey.slice(-4)} exceeded its quota. Trying next key...`);
                    continue; // Try next key
                }
                
                // For other errors (like invalid key), also try the next key.
                console.warn(`API request failed for key ...${apiKey.slice(-4)} with reason: ${reason || 'unknown'}. Trying next key...`);
                continue;
            }

            // Success: Update quota
            sessionQuotaUsed += cost;
            dailyQuotaUsed += cost;
            try {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('youtubeDailyQuota', JSON.stringify({ date: today, used: dailyQuotaUsed }));
            } catch (e) {
                 console.error("Failed to save daily quota to localStorage", e);
            }
            if (onQuotaChangeCallback) {
                onQuotaChangeCallback({ session: sessionQuotaUsed, daily: dailyQuotaUsed });
            }

            // Success: Update the key index for the next independent operation and return data.
            currentKeyIndex = (keyIndex + 1) % apiKeys.length;
            if (onKeyIndexChangeCallback) {
                onKeyIndexChangeCallback(currentKeyIndex);
            }
            return await response.json();

        } catch (error) {
            // Catches network errors, etc.
            console.error(`Network or other error with key ...${apiKey.slice(-4)}`, error);
            lastError = error instanceof Error ? error : new Error('A network error occurred.');
            // Continue to try the next key.
        }
    }

    // If the loop completes, all keys have failed.
    throw new Error(`All ${apiKeys.length} API key(s) failed. Last error: ${lastError?.message || 'Unknown error'}`);
};


/**
 * Gets the channel ID. Handles different inputs like custom URLs or handles.
 * @param channelIdentifier The channel ID, custom URL name, or handle.
 * @returns The standard channel ID (UC...).
 */
async function resolveChannelId(channelIdentifier: string): Promise<string> {
    if (channelIdentifier.startsWith('UC')) {
        return channelIdentifier;
    }

    try {
        const data = await fetchYouTubeAPI('channels', { part: 'id', forUsername: channelIdentifier });
        if (data.items && data.items.length > 0) {
            return data.items[0].id;
        }
    } catch (error) {
        console.warn('Could not resolve channel ID with forUsername, trying search...');
    }
    
    const searchData = await fetchYouTubeAPI('search', { part: 'snippet', q: channelIdentifier, type: 'channel' });
    if (searchData.items && searchData.items.length > 0 && searchData.items[0].snippet.channelId) {
        return searchData.items[0].snippet.channelId;
    }

    throw new Error('Could not find a YouTube channel for the given identifier.');
}

/**
 * Fetches the main statistics for a given channel.
 * @param channelIdentifier The channel ID, custom URL name, or handle.
 * @returns An object containing channel stats.
 */
export const getChannelStats = async (
    channelIdentifier: string
): Promise<ChannelStats> => {
    const channelId = await resolveChannelId(channelIdentifier);
    
    const channelData = await fetchYouTubeAPI('channels', {
        part: 'snippet,statistics,contentDetails',
        id: channelId,
    });

    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found.');
    }

    const channel = channelData.items[0];
    const channelStats: ChannelStats = {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
        // FIX: Add missing 'history' property to match the ChannelStats type.
        history: [],
    };
    return channelStats;
};

/**
 * Fetches a paginated list of a channel's latest videos and their stats using the more efficient playlistItems endpoint.
 * @param playlistId The ID of the channel's "uploads" playlist.
 * @param maxResults The number of recent videos to fetch per page.
 * @param pageToken The token for the next page of results.
 * @returns An object containing a list of video stats and the next page token.
 */
export const getChannelVideos = async (
    playlistId: string,
    maxResults: number,
    pageToken?: string
): Promise<{ videos: VideoStat[], nextPageToken?: string }> => {
    const playlistParams: Record<string, string> = {
        part: 'snippet', // We need snippet to get the video ID
        playlistId: playlistId,
        maxResults: String(maxResults),
    };
    if (pageToken) {
        playlistParams.pageToken = pageToken;
    }

    const playlistData = await fetchYouTubeAPI('playlistItems', playlistParams);
    
    const videoIds = playlistData.items
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter(Boolean) // Filter out any potential null/undefined IDs
        .join(',');
    
    if (!videoIds) {
        return { videos: [], nextPageToken: undefined };
    }

    const videosData = await fetchYouTubeAPI('videos', {
        part: 'snippet,statistics',
        id: videoIds,
    });

    const videoDataMap = new Map(videosData.items.map((item: any) => [item.id, item]));
    const originalOrderVideoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);

    const videos: VideoStat[] = originalOrderVideoIds.map((id: string) => {
        // FIX: Cast 'item' to 'any' to allow property access, as it was being inferred as 'unknown'.
        const item: any = videoDataMap.get(id);
        if (!item) return null;
        return {
            id: item.id,
            publishedAt: item.snippet.publishedAt,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            commentCount: item.statistics.commentCount,
        };
    }).filter((v): v is VideoStat => v !== null);

    return { videos, nextPageToken: playlistData.nextPageToken };
};


/**
 * Fetches the oldest video from a channel's upload playlist. This is a fix for the previous implementation.
 * @param playlistId The ID of the channel's "uploads" playlist.
 * @returns An object containing the oldest video's info, or null.
 */
export const getOldestVideo = async (
    playlistId: string,
): Promise<VideoStat | null> => {
    try {
        // The playlistItems endpoint returns items in the order they were added (oldest first).
        // We fetch a page and sort client-side just to be absolutely sure and robust.
        const playlistData = await fetchYouTubeAPI('playlistItems', {
            part: 'snippet',
            playlistId: playlistId,
            maxResults: '50',
        });

        if (!playlistData.items || playlistData.items.length === 0) {
            return null;
        }
        
        // Sort by publishedAt ascending to find the true oldest video in the batch
        const sortedItems = playlistData.items.sort((a: any, b: any) =>
            new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime()
        );

        const item = sortedItems[0].snippet;
        const videoId = item.resourceId.videoId;
        
        const video: VideoStat = {
            id: videoId,
            publishedAt: item.publishedAt,
            title: item.title,
            description: item.description,
            thumbnailUrl: item.thumbnails.high?.url || item.thumbnails.default.url,
            viewCount: '0', // Not available from this endpoint
            likeCount: '0', // Not available from this endpoint
            commentCount: '0', // Not available from this endpoint
        };

        return video;
    } catch (error) {
        console.error("Failed to fetch oldest video:", error);
        return null;
    }
};

/**
 * Validates a single YouTube API key by making a lightweight request.
 * @param key The API key to validate.
 * @returns A promise that resolves to an object indicating if the key is valid and an optional error message.
 */
export const validateYouTubeApiKey = async (key: string): Promise<{ status: KeyStatus; error?: string }> => {
    if (!key || key.trim() === '') {
        return { status: 'invalid', error: 'Key cannot be empty.' };
    }
    try {
        // Use i18nLanguages.list, a very lightweight (1 quota unit) call for validation.
        const query = new URLSearchParams({ part: 'snippet', key: key }).toString();
        const response = await fetch(`${API_BASE_URL}/i18nLanguages?${query}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            const reason = errorData.error?.errors?.[0]?.reason;
            const message = errorData.error?.message || 'Failed to validate key.';

            if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
                return { status: 'quota_exceeded', error: 'Quota Exceeded' };
            }
            if (message.toLowerCase().includes('api key not valid')) {
                return { status: 'invalid', error: 'Invalid API Key' };
            }
            return { status: 'invalid', error: message };
        }
        // If we get a 200 OK, the key is valid and has quota.
        return { status: 'valid' };
    } catch (err: any) {
        console.error(`Validation failed for key ending in ...${key.slice(-4)}`, err);
        return { status: 'invalid', error: 'Network error or unknown issue. Check console.' };
    }
};


// --- New functions for date range filtering ---

/**
 * Gets total views and video count for a channel within a specific date range.
 * NOTE: This is a very quota-intensive operation.
 * @param channelId The channel's ID.
 * @param startDate The start of the date range (ISO string).
 * @param endDate The end of the date range (ISO string).
 * @returns An object with view and video counts for the period.
 */
export const getChannelStatsForDateRange = async (channelId: string, startDate: string, endDate: string) => {
    let totalViews = 0;
    let totalVideos = 0;
    let nextPageToken: string | undefined = undefined;
    const batchSize = 50; // Max per search query

    do {
        const searchParams: Record<string, string> = {
            part: 'id',
            channelId: channelId,
            maxResults: String(batchSize),
            order: 'date',
            type: 'video',
            publishedAfter: new Date(startDate).toISOString(),
            publishedBefore: new Date(endDate).toISOString(),
        };
        if (nextPageToken) {
            searchParams.pageToken = nextPageToken;
        }

        const searchData = await fetchYouTubeAPI('search', searchParams);
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
        
        if (videoIds) {
            const videosData = await fetchYouTubeAPI('videos', {
                part: 'statistics',
                id: videoIds,
            });
            videosData.items.forEach((item: any) => {
                totalViews += parseInt(item.statistics.viewCount || '0', 10);
                totalVideos++;
            });
        }
        nextPageToken = searchData.nextPageToken;

    } while (nextPageToken);

    return {
        viewCount: String(totalViews),
        videoCount: String(totalVideos),
    };
};

/**
 * Fetches the newest video in a given date range.
 */
export const getNewestVideoInRange = async (channelId: string, playlistId: string, startDate?: string, endDate?: string): Promise<VideoStat | null> => {
    if (!startDate || !endDate) return getChannelVideos(playlistId, 1).then(data => data.videos[0] || null);
    
    const searchParams: Record<string, string> = {
        part: 'snippet',
        channelId: channelId,
        maxResults: '1',
        order: 'date',
        type: 'video',
        publishedAfter: new Date(startDate).toISOString(),
        publishedBefore: new Date(endDate).toISOString(),
    };
    const searchData = await fetchYouTubeAPI('search', searchParams);
    if (!searchData.items || searchData.items.length === 0) return null;
    
    const item = searchData.items[0];
    return {
        id: item.id.videoId,
        publishedAt: item.snippet.publishedAt,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        viewCount: '0', likeCount: '0', commentCount: '0',
    };
};

/**
 * Fetches the oldest video in a given date range.
 */
export const getOldestVideoInRange = async (playlistId: string, startDate?: string, endDate?: string): Promise<VideoStat | null> => {
     if (!startDate || !endDate) return getOldestVideo(playlistId);

    let nextPageToken: string | undefined = undefined;
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    let oldestVideoInRange: VideoStat | null = null;

    do {
        const params: Record<string, string> = {
            part: 'snippet',
            playlistId,
            maxResults: '50',
        };
        if (nextPageToken) params.pageToken = nextPageToken;
        
        const data = await fetchYouTubeAPI('playlistItems', params);

        for (const item of data.items) {
            const snippet = item.snippet;
            const publishedAtTime = new Date(snippet.publishedAt).getTime();
            if (publishedAtTime >= startDateTime && publishedAtTime <= endDateTime) {
                // Since playlistItems are ordered oldest to newest, the first one we find is a candidate.
                // We continue searching to ensure we find the absolute oldest if pages are out of order.
                 const currentVideo = {
                    id: snippet.resourceId.videoId,
                    publishedAt: snippet.publishedAt,
                    title: snippet.title,
                    description: snippet.description,
                    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
                    viewCount: '0', likeCount: '0', commentCount: '0',
                };

                if (!oldestVideoInRange || new Date(currentVideo.publishedAt).getTime() < new Date(oldestVideoInRange.publishedAt).getTime()) {
                    oldestVideoInRange = currentVideo;
                }
            }
        }
        nextPageToken = data.nextPageToken;

    } while (nextPageToken);
    
    return oldestVideoInRange;
};
