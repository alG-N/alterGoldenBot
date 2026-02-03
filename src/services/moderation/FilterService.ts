/**
 * Filter Service
 * Handles word filtering and content scanning
 * @module services/moderation/FilterService
 */

// Use require for CommonJS repository module
const FilterRepository = require('../../repositories/moderation/FilterRepository.js') as {
    getAll: (guildId: string) => Promise<unknown[]>;
    getById: (id: number) => Promise<unknown>;
    getByPattern: (guildId: string, pattern: string) => Promise<unknown>;
    add: (data: Record<string, unknown>) => Promise<unknown>;
    addBulk: (guildId: string, filters: unknown[], createdBy: string) => Promise<number>;
    remove: (id: number) => Promise<boolean>;
    removeByPattern: (guildId: string, pattern: string) => Promise<boolean>;
    removeAll: (guildId: string) => Promise<number>;
    count: (guildId: string) => Promise<number>;
    search: (guildId: string, searchTerm: string) => Promise<unknown[]>;
};

// Use require for config
const filterConfigModule = require('../../config/features/moderation/filters.js') as {
    default?: {
        settings?: {
            stripZalgo?: boolean;
            normalizeUnicode?: boolean;
            checkLeetspeak?: boolean;
            minWordLength?: number;
        };
        zalgoPattern?: RegExp;
        unicodeMap?: Record<string, string>;
        leetspeak?: Record<string, string>;
        exemptPatterns?: RegExp[];
        presets?: Record<string, { words: Partial<Filter>[] }>;
    };
    settings?: {
        stripZalgo?: boolean;
        normalizeUnicode?: boolean;
        checkLeetspeak?: boolean;
        minWordLength?: number;
    };
    zalgoPattern?: RegExp;
    unicodeMap?: Record<string, string>;
    leetspeak?: Record<string, string>;
    exemptPatterns?: RegExp[];
    presets?: Record<string, { words: Partial<Filter>[] }>;
};
// Handle both ESM default export and direct export
const filterConfig = filterConfigModule.default || filterConfigModule;
// TYPES
export interface Filter {
    id: number;
    guild_id: string;
    pattern: string;
    match_type: 'exact' | 'word' | 'contains' | 'regex';
    action: string;
    severity: number;
    created_by: string;
    created_at: Date;
}

export interface FilterMatch {
    filter: Filter;
    matched: boolean;
    pattern: string;
    action: string;
    severity: number;
}

interface CacheEntry {
    filters: Filter[];
    timestamp: number;
}
// CACHE
const filterCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// CORE FUNCTIONS
/**
 * Get filters for a guild (with caching)
 */
export async function getFilters(guildId: string): Promise<Filter[]> {
    const cached = filterCache.get(guildId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.filters;
    }

    const filters = await FilterRepository.getAll(guildId) as Filter[];
    filterCache.set(guildId, { filters, timestamp: Date.now() });
    return filters;
}

/**
 * Invalidate cache for a guild
 */
export function invalidateCache(guildId: string): void {
    filterCache.delete(guildId);
}

/**
 * Normalize text for matching
 */
export function normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    // Strip zalgo
    if (filterConfig.settings?.stripZalgo && filterConfig.zalgoPattern) {
        normalized = normalized.replace(filterConfig.zalgoPattern, '');
    }

    // Normalize unicode
    if (filterConfig.settings?.normalizeUnicode && filterConfig.unicodeMap) {
        for (const [char, replacement] of Object.entries(filterConfig.unicodeMap)) {
            normalized = normalized.replace(new RegExp(char, 'g'), replacement);
        }
    }

    // Convert leetspeak
    if (filterConfig.settings?.checkLeetspeak && filterConfig.leetspeak) {
        for (const [char, replacement] of Object.entries(filterConfig.leetspeak)) {
            normalized = normalized.replace(new RegExp(`\\${char}`, 'g'), replacement);
        }
    }

    return normalized;
}

/**
 * Check if text matches a filter pattern
 */
export function matchesFilter(text: string, filter: Filter): boolean {
    const normalizedText = normalizeText(text);
    const pattern = filter.pattern.toLowerCase();

    switch (filter.match_type) {
        case 'exact':
            return normalizedText === pattern;

        case 'word': {
            const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, 'i');
            return regex.test(normalizedText);
        }

        case 'contains':
            return normalizedText.includes(pattern);

        case 'regex': {
            try {
                const regex = new RegExp(filter.pattern, 'i');
                return regex.test(text);
            } catch {
                return false;
            }
        }

        default:
            return normalizedText.includes(pattern);
    }
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check message content against filters
 */
export async function checkMessage(guildId: string, content: string): Promise<FilterMatch | null> {
    if (!content || content.length < (filterConfig.settings?.minWordLength || 2)) {
        return null;
    }

    // Check exempt patterns
    let processedContent = content;
    if (filterConfig.exemptPatterns) {
        for (const pattern of filterConfig.exemptPatterns) {
            processedContent = processedContent.replace(pattern, '');
        }
    }

    if (!processedContent.trim()) return null;

    const filters = await getFilters(guildId);

    for (const filter of filters) {
        if (matchesFilter(processedContent, filter)) {
            return {
                filter,
                matched: true,
                pattern: filter.pattern,
                action: filter.action,
                severity: filter.severity
            };
        }
    }

    return null;
}

/**
 * Add a filter
 */
export async function addFilter(data: Partial<Filter> & { guildId: string }): Promise<Filter> {
    const filter = await FilterRepository.add(data as Record<string, unknown>) as Filter;
    invalidateCache(data.guildId);
    return filter;
}

/**
 * Add multiple filters
 */
export async function addFilters(
    guildId: string,
    filters: Partial<Filter>[],
    createdBy: string
): Promise<number> {
    const count = await FilterRepository.addBulk(guildId, filters, createdBy);
    invalidateCache(guildId);
    return count;
}

/**
 * Remove a filter
 */
export async function removeFilter(guildId: string, pattern: string): Promise<boolean> {
    const result = await FilterRepository.removeByPattern(guildId, pattern);
    invalidateCache(guildId);
    return result;
}

/**
 * Remove filter by ID
 */
export async function removeFilterById(id: number, guildId?: string): Promise<boolean> {
    const result = await FilterRepository.remove(id);
    if (guildId) invalidateCache(guildId);
    return result;
}

/**
 * Get all filters for a guild
 */
export async function listFilters(guildId: string): Promise<Filter[]> {
    return FilterRepository.getAll(guildId) as Promise<Filter[]>;
}

/**
 * Clear all filters for a guild
 */
export async function clearFilters(guildId: string): Promise<number> {
    const count = await FilterRepository.removeAll(guildId);
    invalidateCache(guildId);
    return count;
}

/**
 * Import a preset filter list
 */
export async function importPreset(
    guildId: string,
    presetName: string,
    createdBy: string
): Promise<number> {
    const preset = filterConfig.presets?.[presetName];
    if (!preset) {
        throw new Error(`Preset "${presetName}" not found`);
    }

    return addFilters(guildId, preset.words, createdBy);
}

/**
 * Get filter count for a guild
 */
export async function getFilterCount(guildId: string): Promise<number> {
    return FilterRepository.count(guildId);
}

/**
 * Search filters
 */
export async function searchFilters(guildId: string, searchTerm: string): Promise<Filter[]> {
    return FilterRepository.search(guildId, searchTerm) as Promise<Filter[]>;
}
// EXPORTS
export default {
    getFilters,
    invalidateCache,
    normalizeText,
    matchesFilter,
    checkMessage,
    addFilter,
    addFilters,
    removeFilter,
    removeFilterById,
    listFilters,
    clearFilters,
    importPreset,
    getFilterCount,
    searchFilters
};
