/**
 * Music Events Module
 * @module services/music/events
 */

export { default as musicEventBus, MusicEventBus } from './MusicEventBus.js';
export { default as MusicEvents } from './MusicEvents.js';
export { default as playbackEventHandler, PlaybackEventHandler } from './PlaybackEventHandler.js';

// Re-export types
export type {
    MusicEventName,
    TrackEventData,
    PlaybackEventData,
    QueueEventData,
    VoiceEventData,
    AutoPlayEventData,
    SkipVoteEventData,
    NowPlayingEventData,
    SystemEventData,
    MusicTrack,
    TrackInfo
} from './MusicEvents.js';
