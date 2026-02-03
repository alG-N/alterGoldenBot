"use strict";
/**
 * Filter Service
 * Handles word filtering and content scanning
 * @module services/moderation/FilterService
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilters = getFilters;
exports.invalidateCache = invalidateCache;
exports.normalizeText = normalizeText;
exports.matchesFilter = matchesFilter;
exports.checkMessage = checkMessage;
exports.addFilter = addFilter;
exports.addFilters = addFilters;
exports.removeFilter = removeFilter;
exports.removeFilterById = removeFilterById;
exports.listFilters = listFilters;
exports.clearFilters = clearFilters;
exports.importPreset = importPreset;
exports.getFilterCount = getFilterCount;
exports.searchFilters = searchFilters;
// Use require for CommonJS repository module
const FilterRepository = require('../../repositories/moderation/FilterRepository.js');
// Use require for config
const filterConfigModule = require('../../config/features/moderation/filters.js');
// Handle both ESM default export and direct export
const filterConfig = filterConfigModule.default || filterConfigModule;
// CACHE
const filterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// CORE FUNCTIONS
/**
 * Get filters for a guild (with caching)
 */
async function getFilters(guildId) {
    const cached = filterCache.get(guildId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.filters;
    }
    const filters = await FilterRepository.getAll(guildId);
    filterCache.set(guildId, { filters, timestamp: Date.now() });
    return filters;
}
/**
 * Invalidate cache for a guild
 */
function invalidateCache(guildId) {
    filterCache.delete(guildId);
}
/**
 * Normalize text for matching
 */
function normalizeText(text) {
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
function matchesFilter(text, filter) {
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
            }
            catch {
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
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Check message content against filters
 */
async function checkMessage(guildId, content) {
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
    if (!processedContent.trim())
        return null;
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
async function addFilter(data) {
    const filter = await FilterRepository.add(data);
    invalidateCache(data.guildId);
    return filter;
}
/**
 * Add multiple filters
 */
async function addFilters(guildId, filters, createdBy) {
    const count = await FilterRepository.addBulk(guildId, filters, createdBy);
    invalidateCache(guildId);
    return count;
}
/**
 * Remove a filter
 */
async function removeFilter(guildId, pattern) {
    const result = await FilterRepository.removeByPattern(guildId, pattern);
    invalidateCache(guildId);
    return result;
}
/**
 * Remove filter by ID
 */
async function removeFilterById(id, guildId) {
    const result = await FilterRepository.remove(id);
    if (guildId)
        invalidateCache(guildId);
    return result;
}
/**
 * Get all filters for a guild
 */
async function listFilters(guildId) {
    return FilterRepository.getAll(guildId);
}
/**
 * Clear all filters for a guild
 */
async function clearFilters(guildId) {
    const count = await FilterRepository.removeAll(guildId);
    invalidateCache(guildId);
    return count;
}
/**
 * Import a preset filter list
 */
async function importPreset(guildId, presetName, createdBy) {
    const preset = filterConfig.presets?.[presetName];
    if (!preset) {
        throw new Error(`Preset "${presetName}" not found`);
    }
    return addFilters(guildId, preset.words, createdBy);
}
/**
 * Get filter count for a guild
 */
async function getFilterCount(guildId) {
    return FilterRepository.count(guildId);
}
/**
 * Search filters
 */
async function searchFilters(guildId, searchTerm) {
    return FilterRepository.search(guildId, searchTerm);
}
// EXPORTS
exports.default = {
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
//# sourceMappingURL=FilterService.js.map