/**
 * API Services Index
 * Re-exports all API services (TypeScript)
 * @module services/api
 */
// GENERAL API SERVICES
// Google Service
export { googleService, GoogleService } from './googleService';
export type { 
    SearchResultItem, 
    SearchResponse, 
    SearchOptions as GoogleSearchOptions 
} from './googleService';

// Wikipedia Service
export { wikipediaService, WikipediaService } from './wikipediaService';
export type {
    WikiSearchResult,
    WikiSearchResponse,
    WikiArticle,
    WikiArticleResponse,
    OnThisDayEvent,
    OnThisDayResponse,
    OnThisDayPage,
    SearchOptions as WikiSearchOptions
} from './wikipediaService';

// Fandom Wiki Service
export { fandomService, FandomService, POPULAR_WIKIS } from './fandomService';
export type {
    SearchResult as FandomSearchResult,
    SearchResponse as FandomSearchResponse,
    ArticleData,
    ArticleResponse,
    WikiInfo,
    WikiInfoResponse,
    PopularWiki,
    WikiSuggestion
} from './fandomService';
// ANIME/MANGA SERVICES
// AniList Service
export { anilistService, AnilistService } from './anilistService';
export type {
    AnimeMedia,
    AnimeTitle,
    CoverImage,
    FuzzyDate,
    AiringSchedule,
    CharacterEdge,
    RelationEdge,
    Trailer,
    AutocompleteMedia
} from './anilistService';

// MyAnimeList Service
export { myAnimeListService, MyAnimeListService } from './myAnimeListService';
export type {
    MALAnimeData,
    MALMangaData,
    MALTitle,
    MALDate,
    MALAuthor,
    MALAutocompleteItem
} from './myAnimeListService';
// GAMING SERVICES
// Steam Service
export { steamService, SteamService } from './steamService';
export type {
    SteamGame,
    SteamSaleResponse,
    SteamPriceOverview,
    SteamAppDetailsResponse,
    SteamFeaturedGame,
    SteamSpyData
} from './steamService';
// SOCIAL MEDIA SERVICES
// Reddit Service
export { redditService, RedditService } from './redditService';
export type {
    SubredditInfo,
    RedditPost,
    RedditPostsResult
} from './redditService';

// Pixiv Service
export { pixivService, PixivService } from './pixivService';
export type {
    PixivIllust,
    PixivNovel,
    PixivUser,
    PixivTag,
    PixivImageUrls,
    SearchOptions as PixivSearchOptions,
    SearchResult as PixivSearchResult,
    RankingOptions
} from './pixivService';
// NSFW SERVICES
// NHentai Service
export { nhentaiService, NHentaiService } from './nhentaiService';
export type {
    NHentaiGallery,
    NHentaiTag,
    NHentaiTitle,
    NHentaiImages,
    GalleryResult,
    SearchResult as NHentaiSearchResult,
    SearchData as NHentaiSearchData,
    PageUrl,
    ParsedTags
} from './nhentaiService';

// Rule34 Service
export { rule34Service, Rule34Service } from './rule34Service';
export type {
    Rule34Post,
    Rule34RawPost,
    SearchResult as Rule34SearchResult,
    AutocompleteSuggestion as Rule34Suggestion,
    RelatedTag
} from './rule34Service';