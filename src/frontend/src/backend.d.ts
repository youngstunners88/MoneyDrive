import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface StakingRecord {
    stakeId: string;
    dissolveDelayDays: bigint;
    notes: string;
    icpAmount: number;
    startDate: bigint;
}
export interface FetchedEvent {
    id: string;
    title: string;
    fetchedAt: bigint;
    venue: string;
    city: string;
    date: string;
    driverRelevance: string;
    category: string;
    isNew: boolean;
}
export interface Summary {
    cacheHits: bigint;
    gatewayRequests: bigint;
    directRequests: bigint;
    avgDirectMs: bigint;
    errorCount: bigint;
    avgGatewayMs: bigint;
    totalRequests: bigint;
}
export interface EmailLog {
    id: string;
    status: string;
    driverId: string;
    subject: string;
    recipient: string;
    sentAt: bigint;
    emailType: string;
    errorMsg?: string;
}
export interface CampaignMetrics {
    lastUpdated: bigint;
    campaignId: string;
    sends: bigint;
    conversionRate: number;
    revenueAttributed: number;
    paidConversions: bigint;
    trialStarts: bigint;
}
export interface FleetExpenseEntry {
    expenseId: string;
    date: bigint;
    notes: string;
    category: string;
    amount: number;
    vehicleId: string;
}
export interface FleetVehicleSummary {
    model: string;
    expenseCount: bigint;
    make: string;
    totalIncome: number;
    totalExpenses: number;
    plateNumber: string;
    tripCount: bigint;
    vehicleId: string;
    netProfit: number;
}
export interface VoiceUsage {
    date: bigint;
    count: bigint;
}
export interface PresentationInput {
    targetIndustry: string;
    tripsPerMonth: bigint;
    estimatedMonthlyExposure: bigint;
    city: string;
    targetCompanyName: string;
    vehicleModel: string;
    routes: string;
    proposedDealValue: bigint;
    driverName: string;
    avgPassengers: bigint;
}
export interface ExposureFactor {
    weight: number;
    name: string;
    reason: string;
}
export interface LatencyPercentiles {
    p50: bigint;
    p95: bigint;
    p99: bigint;
}
export interface FleetIncomeEntry {
    incomeId: string;
    date: bigint;
    platform: string;
    notes: string;
    amount: number;
    vehicleId: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface ExpenseEntry {
    expenseId: string;
    date: bigint;
    notes: string;
    category: string;
    amount: number;
}
export interface RouteOptIn {
    driverId: string;
    secondaryRoute?: SAZone;
    optedInAt: bigint;
    primaryRoute: SAZone;
}
export interface VideoClip {
    id: string;
    driverId: string;
    brandedStorageRef?: string;
    title?: string;
    processingStatus: ClipStatus;
    startSec: number;
    storageRef: string;
    uploadId: string;
    durationSec: number;
    errorMsg?: string;
    captionsVttRef?: string;
    endSec: number;
}
export interface ForumPost {
    id: ForumPostId;
    deleted: boolean;
    likeCount: bigint;
    authorId: UserId;
    voiceNoteKey?: string;
    text: string;
    isAnonymous: boolean;
    timestamp: Timestamp;
    replyCount: bigint;
    channel: ForumChannel;
    parentId?: ForumPostId;
    flagCount: bigint;
}
export interface ExposureMetrics {
    confidenceScore: number;
    routeName: string;
    factors: Array<ExposureFactor>;
    dailyPedestrians: bigint;
    monthlyExposure: bigint;
    dailyVehicles: bigint;
}
export interface Event {
    eventId: string;
    title: string;
    date: bigint;
    description: string;
    category: string;
    isUserCreated: boolean;
    location: string;
}
export interface XPostingConfig {
    xAccessTokenSecret: string;
    monthlyEarningsCents: bigint;
    totalPostsPublished: bigint;
    xApiKey: string;
    earningsThresholdUsd: bigint;
    xAccessToken: string;
    xApiSecret: string;
    lastPostAt?: bigint;
    isUnlocked: boolean;
}
export interface BrandingConfig {
    accentColor: string;
    callToAction: string;
    driverName: string;
    showMoneyDriveLogo: boolean;
    musicPreference: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface WhatsAppConfig {
    webhookSecret: string;
    apiKey: string;
    phoneNumber: string;
}
export type UserId = Principal;
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export type Result = {
    __kind__: "ok";
    ok: {
        url: string;
        claimUrl: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface RecommendationOutcome {
    revenue?: bigint;
    driverAction?: string;
    recommendationId: bigint;
    timestamp: bigint;
    outcome?: string;
}
export interface ProactiveTrigger {
    page: string;
    triggerType: string;
    message: string;
}
export interface CampaignCreative {
    videoJobId?: string;
    imageUrl: string;
    copySubjectLine: string;
    copyBody: string;
    copyHook: string;
    videoUrl?: string;
}
export interface ShortsJob {
    id: string;
    driverId: Principal;
    selectedSegmentEnd?: bigint;
    outputMp4Url?: string;
    clipStatus: ShortsStatus;
    selectedSegmentStart?: bigint;
    createdAt: bigint;
    sourceUrl: string;
    sourceType: Variant_upload_youtube;
    errorMsg?: string;
}
export interface VideoPost {
    id: string;
    status: PostStatus;
    clipId: string;
    driverId: string;
    postedAt?: bigint;
    platformPostId?: string;
    platform: SocialPlatform;
    errorMsg?: string;
    scheduledAt?: bigint;
}
export interface MonthlyInsights {
    suggestedSystemPromptUpdate: string;
    driverId: string;
    month: bigint;
    topSurgeRecommendations: Array<string>;
    surgeAccuracy: number;
    productConversions: Array<string>;
    year: bigint;
    advertisingStats: {
        dealsNegotiating: Array<string>;
        companiesInterested: Array<string>;
        dealsClosed: Array<string>;
        pitchesSent: bigint;
    };
}
export interface NdunaSystemPromptState {
    evolutionDelta: string;
    lastEvolved?: bigint;
    basePrompt: string;
    evolutionCount: bigint;
}
export interface CompanyResponsiveness {
    companyName: string;
    successfulDeals: bigint;
    responseRate: bigint;
    totalPitches: bigint;
    avgDealValue: bigint;
}
export interface DocumentRecord {
    id: string;
    driverId: string;
    deleted: boolean;
    fileName: string;
    notes: string;
    storageRef: string;
    markdownStatus?: MarkdownStatus;
    docType: DocumentType;
    uploadedAt: bigint;
    markdownContent?: string;
}
export interface BrowserbaseCompanyResult {
    keyServices: Array<string>;
    source: string;
    websiteUrl: string;
    hiringSignals: boolean;
    estimatedEmployees: string;
    description: string;
    contactEmail?: string;
    companyName: string;
    scrapedAt: bigint;
    industry: string;
}
export interface PostingSchedule {
    driverId: string;
    preferredHourUtc: bigint;
    enabled: boolean;
    postsPerWeek: bigint;
    preferredDays: Array<bigint>;
    platformsEnabled: Array<SocialPlatform>;
}
export interface SchedulerConfig {
    dayOfWeek: bigint;
    hour: bigint;
    enabled: boolean;
}
export interface ScrapedLead {
    id: string;
    status: LeadStatus;
    tavilySnippet: string;
    driverId: string;
    source: string;
    scoringFactors: string;
    year: bigint;
    weekNumber: bigint;
    email: string;
    website: string;
    browserbaseEnriched?: BrowserbaseCompanyResult;
    exaEnriched?: ExaCompanyResult;
    address: string;
    companyName: string;
    tavilyHiringSignal: boolean;
    phone: string;
    compositeScore: bigint;
    scrapedAt: bigint;
    industry: string;
}
export interface CompetitiveStats {
    month: string;
    cityLeaderboard: Array<CityLeaderEntry>;
    totalDriversInNetwork: bigint;
    topCompanies: Array<CompanyResponsiveness>;
    networkSurgeAccuracy: number;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface LeadBatch {
    driverId: string;
    generatedAt: bigint;
    year: bigint;
    weekNumber: bigint;
    leads: Array<ScrapedLead>;
    totalRanked: bigint;
    totalScraped: bigint;
}
export interface DriverAnalyticsProfile {
    totalTrips: bigint;
    totalKmsDriven: number;
    lastCalculated: bigint;
    totalExpenses: number;
    peakHourRanges: Array<string>;
    totalEarnings: number;
    totalFuelCost: number;
    estimatedCarExposure: bigint;
    topEarningDays: Array<string>;
    avgEarningsPerHour: number;
}
export interface WhatsAppConversationEntry {
    driverId: string;
    direction: MessageDirection;
    messageId: string;
    body: string;
    deliveryStatus: MessageDeliveryStatus;
    timestamp: bigint;
    channel: ConversationChannel;
    errorMsg?: string;
    mediaStorageRef?: string;
}
export interface NdunaEmail {
    messageId: string;
    subject: string;
    preview: string;
    from: string;
    isRead: boolean;
    receivedAt: bigint;
    inboxId: string;
}
export interface CampaignConfig {
    maxActiveCampaignsPerDay: bigint;
    maxMessagesPerSegmentPerWeek: bigint;
    enabled: boolean;
    weeklyReportEnabled: boolean;
    adminEmail: string;
}
export interface ZeroXWorkTask {
    reward: number;
    title: string;
    description: string;
    taskId: string;
    capability: string;
}
export interface OpportunityFinding {
    id: string;
    driverId: string;
    title: string;
    expiresAt: bigint;
    source: string;
    description: string;
    relevanceScore: bigint;
    category: OpportunityCategory;
    discoveredAt: bigint;
    dismissed: boolean;
}
export type ForumPostId = string;
export interface WhisperConfig__1 {
    apiKey: string;
}
export interface UploadPostConfig {
    accountId: string;
    apiKey: string;
}
export interface CompanyScore {
    matchScore: number;
    companyName: string;
    priority: bigint;
    estimatedDealValue: bigint;
    reason: string;
}
export interface CampaignFailureLog {
    angle: MessageAngle;
    campaignId: string;
    segment: DriverSegment;
    loggedAt: bigint;
    reason: string;
}
export interface OrbisListingConfig {
    providerApiKey: string;
    pricePerCall: number;
    listingName: string;
    autoPublish: boolean;
}
export interface DriverCohortProfile {
    cohortAdvice: string;
    tripsThisMonth: bigint;
    earningsThisMonth: number;
    upgradeRecommendation: string;
    rating: number;
    cohort: DriverCohort;
}
export interface DriverPaymentConfig {
    usdtAddress: string;
    ethAddress: string;
    bankAccount: string;
    usdcAddress: string;
    bankReference: string;
    solAddress: string;
    bankName: string;
    bnbAddress: string;
    btcAddress: string;
    snapScanMerchantId?: string;
    baseAddress: string;
}
export interface ZeroXWorkEarnings {
    tasksCompleted: bigint;
    totalUSDCEarned: number;
}
export interface NdunaRecommendation {
    driverId: string;
    content: string;
    recommendationType: string;
    timestamp: bigint;
    confidence: string;
}
export interface WhisperConfig {
    model: string;
    apiKey: string;
}
export interface Product {
    name: string;
    sellingPrice: number;
    productId: string;
    currentStock: bigint;
}
export interface ReferralConfig {
    bonusDescription: string;
    minTripsToQualify: bigint;
    enabled: boolean;
    bonusSource: string;
    bonusPerReferral: number;
}
export interface AnalyticsSummary {
    totalEvents: bigint;
    ndunaQueryCount: bigint;
    avgNdunaDurationMs?: bigint;
    errorCount: bigint;
    topActions: Array<[string, bigint]>;
}
export interface Trip {
    date: bigint;
    tripId: string;
    platform: string;
    durationMinutes: bigint;
    notes: string;
    amount: number;
}
export interface AgentMailConfig {
    leadFollowupEmailEnabled: boolean;
    ndunaInboxId?: string;
    apiKey: string;
    onboardingEmailEnabled: boolean;
    weeklyBriefingEmailEnabled: boolean;
}
export interface DriverMemoryEntry {
    key: string;
    value: string;
    timestamp: bigint;
    category: string;
}
export interface NdunaRecommendationV2 {
    id: string;
    driverId: string;
    content: string;
    recommendationType: RecommendationType;
    timestamp: bigint;
    confidence: ConfidenceLevel;
}
export interface EventIntelligence {
    date: string;
    expectedAttendance: string;
    name: string;
    sourceUrl: string;
    driverOpportunityScore: bigint;
}
export interface HyperframesJob {
    id: string;
    driverId: string;
    topic: string;
    compositionHtml: string;
    mp4Url?: string;
    createdAt: bigint;
    renderStatus: HyperframesRenderStatus;
    errorMsg?: string;
}
export interface Slide {
    dataPoint?: string;
    title: string;
    bullets: Array<string>;
    slideType: string;
    speakerNotes: string;
}
export interface AnalyticsEvent {
    id: string;
    driverId: string;
    action: string;
    metadata: string;
    errorMessage?: string;
    tier?: string;
    timestamp: bigint;
    category: string;
    success: boolean;
    durationMs?: bigint;
}
export interface OutcomeStats {
    partialCount: bigint;
    avgRevenuePerTried: bigint;
    surgeAccuracy: number;
    totalRecommendations: bigint;
    triedCount: bigint;
    skippedCount: bigint;
    totalRevenueTracked: bigint;
}
export interface WeeklyReport {
    activeCampaigns: Array<string>;
    worstAngle?: string;
    totalTrialStarts: bigint;
    topAngle?: string;
    totalSends: bigint;
    revenueAttributed: number;
    totalConversions: bigint;
    weekOf: string;
}
export interface CompanyPitch {
    id: string;
    status: PitchStatus;
    driverId: string;
    pitchDate: bigint;
    expectedValue?: bigint;
    createdAt: bigint;
    contactPerson?: string;
    updatedAt: bigint;
    notes?: string;
    contactEmail?: string;
    companyName: string;
    lastFollowUp?: bigint;
    contactPhone?: string;
}
export interface ScraperAuditLog {
    id: string;
    url: string;
    driverId: string;
    source: string;
    errorMessage?: string;
    timestamp: bigint;
    success: boolean;
    companiesFound: bigint;
}
export interface Sale {
    saleId: string;
    date: bigint;
    productName: string;
    totalAmount: number;
    quantity: bigint;
}
export interface IntelligenceResult {
    city: string;
    data: Array<IntelligenceDataPoint>;
    generatedAt: bigint;
    category: string;
}
export interface FuelLog {
    cost: number;
    date: bigint;
    distance: number;
    fuelUsed: number;
}
export interface RecommendationOutcomeV2 {
    driverId: string;
    action: DriverAction;
    revenue?: bigint;
    recordedAt: bigint;
    recommendationId: string;
    notes?: string;
}
export interface FleetVehicle {
    model: string;
    make: string;
    color?: string;
    year?: bigint;
    plateNumber: string;
    notes?: string;
    vehicleId: string;
    dateAdded: bigint;
}
export interface DriverCompetitiveProfile {
    driverId: string;
    surgeAccuracy: number;
    city: string;
    totalInCity: bigint;
    rank: bigint;
    dealsClosedCount: bigint;
    avgDealValue: bigint;
}
export interface ReferralCode {
    ownerName: string;
    ownerId: string;
    code: string;
    createdAt: bigint;
    totalEarned: number;
    timesUsed: bigint;
}
export interface UserProfile {
    vehicleName: string;
    displayName: string;
    subscriptionTier: bigint;
    voiceEnabled: boolean;
    currencyCode: string;
    fuelConsumptionRate: number;
}
export interface EarningsGoal {
    period: string;
    targetAmount: number;
}
export type Timestamp = bigint;
export interface OrderItem {
    productName: string;
    quantity: bigint;
    unitPrice: number;
}
export interface Shift {
    startTime: string;
    status: string;
    endTime: string;
    date: bigint;
    targetEarnings: number;
    notes: string;
    shiftId: string;
}
export interface ExaCompanyResult {
    url: string;
    employeeCount?: string;
    name: string;
    description?: string;
    snippet: string;
    founded?: string;
    contactEmail?: string;
    industry?: string;
}
export interface AbTestResult {
    bConversionRate: number;
    aConversionRate: number;
    campaignAId: string;
    campaignBId: string;
    decidedAt?: bigint;
    winnerCampaignId?: string;
}
export interface VideoAnalytics {
    shares: bigint;
    fetchedAt: bigint;
    views: bigint;
    engagementRate: number;
    platform: SocialPlatform;
    likes: bigint;
    comments: bigint;
    postId: string;
}
export type Result_1 = {
    __kind__: "ok";
    ok: WebsiteJob;
} | {
    __kind__: "err";
    err: string;
};
export interface MetricEntry {
    model: string;
    wasCached: boolean;
    error?: string;
    isGateway: boolean;
    timestamp: bigint;
    durationMs: bigint;
}
export interface PresentationData {
    id: string;
    generatedAt: bigint;
    shareToken: string;
    slides: Array<Slide>;
}
export interface ZeroXWorkStatus {
    tasksCompleted: bigint;
    walletAddress: string;
    activeTaskId?: string;
    registered: boolean;
}
export interface Campaign {
    id: string;
    status: CampaignStatus;
    trackingUtm: string;
    abWinner?: boolean;
    angle: MessageAngle;
    creative?: CampaignCreative;
    approvedAt?: bigint;
    createdAt: bigint;
    rejectionReason?: string;
    publishedAt?: bigint;
    abVariantId?: string;
    segment: DriverSegment;
    isAbTest: boolean;
    channel: CampaignChannel;
    adminNotes?: string;
}
export interface WebsiteJob {
    id: string;
    status: WebsiteJobStatus;
    driverId: string;
    topic: string;
    shareUrl?: string;
    createdAt: bigint;
    htmlContent?: string;
    updatedAt: bigint;
    iteration: bigint;
    errorMsg?: string;
}
export interface ShortsConfig {
    vpsKey?: string;
    vpsUrl?: string;
}
export interface ShortsRequest {
    sourceUrl: string;
    sourceType: Variant_upload_youtube;
}
export interface ForumPage {
    total: bigint;
    nextOffset?: bigint;
    posts: Array<ForumPost>;
}
export interface SmartRecommendation {
    dataPoint: string;
    urgency: string;
    score: CompanyScore;
    companyName: string;
    pitch: string;
}
export interface VideoUpload {
    id: string;
    driverId: string;
    processingStatus: UploadStatus;
    contentType: string;
    fileSizeBytes: bigint;
    fileName: string;
    storageRef: string;
    errorMsg?: string;
    uploadedAt: bigint;
}
export interface DriverSegment {
    city: string;
    tier: bigint;
    platform: string;
    archetype: string;
    estimatedCount: bigint;
}
export interface PassengerOrder {
    paymentMethod: string;
    orderId: string;
    passengerNote: string;
    totalAmount: number;
    timestamp: bigint;
    items: Array<OrderItem>;
    driverName: string;
}
export interface DriverMemory {
    lastUpdated: bigint;
    userProfile: string;
    agentNotes: string;
}
export interface ReferralUse {
    referredUserId: string;
    bonusAmount: number;
    code: string;
    usedAt: bigint;
    bonusPaid: boolean;
}
export interface WeeklyBriefingState {
    briefingDayOfWeek: bigint;
    lastSentAt?: bigint;
    enabled: boolean;
    briefingHour: bigint;
}
export interface VideoJobStatus {
    clipsFailed: bigint;
    postsPosted: bigint;
    postsScheduled: bigint;
    clipsReady: bigint;
    lastUpdatedAt: bigint;
    clipsGenerated: bigint;
    uploadId: string;
}
export interface IntelligenceDataPoint {
    value: number;
    name: string;
    unit: string;
    sampleSize: bigint;
}
export interface IntelligenceQuery {
    city?: string;
    limit: bigint;
    category: IntelligenceCategory;
}
export interface CityLeaderEntry {
    month: string;
    dealsClosed: bigint;
    city: string;
    topCompany: string;
    avgDealValue: bigint;
}
export interface OrbisListingStatus {
    listingId?: string;
    totalCalls: bigint;
    usdcEarned: number;
    listed: boolean;
}
export interface XPost {
    id: bigint;
    status: XPostStatus;
    postType: XPostType;
    postedAt?: bigint;
    content: string;
    retweetsCount: bigint;
    impressionsCount: bigint;
    xPostId?: string;
    likesCount: bigint;
    repliesCount: bigint;
}
export enum CampaignChannel {
    both = "both",
    whatsapp = "whatsapp",
    email = "email"
}
export enum CampaignStatus {
    active = "active",
    completed = "completed",
    pending_approval = "pending_approval",
    approved = "approved",
    rejected = "rejected",
    draft = "draft",
    archived = "archived",
    paused = "paused"
}
export enum ClipStatus {
    pending = "pending",
    captioning = "captioning",
    branding = "branding",
    ready = "ready",
    failed = "failed"
}
export enum ConfidenceLevel {
    LOW = "LOW",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM"
}
export enum ConversationChannel {
    app = "app",
    whatsapp = "whatsapp",
    telegram = "telegram"
}
export enum DocumentType {
    other = "other",
    invoice = "invoice",
    registration = "registration",
    licence = "licence"
}
export enum DriverAction {
    tried = "tried",
    skipped = "skipped",
    partial = "partial"
}
export enum DriverCohort {
    NewDriver = "NewDriver",
    PowerEarner = "PowerEarner",
    GrowthDriver = "GrowthDriver"
}
export enum ForumChannel {
    whatILove = "whatILove",
    featureRequests = "featureRequests",
    whatNeedsWork = "whatNeedsWork"
}
export enum HyperframesRenderStatus {
    pending = "pending",
    rendering = "rendering",
    ready = "ready",
    failed = "failed"
}
export enum IntelligenceCategory {
    surgeWindows = "surgeWindows",
    adConversionRates = "adConversionRates",
    leadQuality = "leadQuality",
    earningsBenchmarks = "earningsBenchmarks",
    topZones = "topZones"
}
export enum LeadStatus {
    pending = "pending",
    pitched = "pitched",
    rejected = "rejected",
    dealClosed = "dealClosed",
    interested = "interested"
}
export enum MarkdownStatus {
    pending = "pending",
    unsupported = "unsupported",
    converting = "converting",
    ready = "ready",
    failed = "failed"
}
export enum MessageAngle {
    limited_time_offer = "limited_time_offer",
    feature_benefit = "feature_benefit",
    referral_incentive = "referral_incentive",
    earnings_proof = "earnings_proof"
}
export enum MessageDeliveryStatus {
    read = "read",
    sent = "sent",
    delivered = "delivered",
    failed = "failed"
}
export enum MessageDirection {
    inbound = "inbound",
    outbound = "outbound"
}
export enum OpportunityCategory {
    businessLead = "businessLead",
    newPlatform = "newPlatform",
    incomeCategory = "incomeCategory",
    platformPromotion = "platformPromotion",
    intercityRoute = "intercityRoute",
    regulatoryChange = "regulatoryChange"
}
export enum PitchStatus {
    closed = "closed",
    sent = "sent",
    abandoned = "abandoned",
    rejected = "rejected",
    interested = "interested",
    negotiating = "negotiating",
    viewed = "viewed"
}
export enum PostStatus {
    scheduled = "scheduled",
    failed = "failed",
    posted = "posted"
}
export enum RecommendationType {
    advertising = "advertising",
    surge = "surge",
    product = "product"
}
export enum SAZone {
    JohannesburgCBD = "JohannesburgCBD",
    CapeTownCBD = "CapeTownCBD",
    PretoriaCBD = "PretoriaCBD",
    Midrand = "Midrand",
    Soweto = "Soweto",
    Generic = "Generic",
    Umhlanga = "Umhlanga",
    DurbanBeachfront = "DurbanBeachfront",
    Sandton = "Sandton"
}
export enum ShortsStatus {
    pending = "pending",
    selecting = "selecting",
    transcribing = "transcribing",
    rendering = "rendering",
    ready = "ready",
    failed = "failed"
}
export enum SocialPlatform {
    linkedin = "linkedin",
    tiktok = "tiktok",
    instagram = "instagram",
    youtube = "youtube"
}
export enum UploadStatus {
    pending = "pending",
    processing = "processing",
    ready = "ready",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_upload_youtube {
    upload = "upload",
    youtube = "youtube"
}
export enum WebsiteJobStatus {
    pending = "pending",
    generating = "generating",
    ready = "ready",
    failed = "failed"
}
export enum XPostStatus {
    scheduled = "scheduled",
    pending = "pending",
    failed = "failed",
    posted = "posted"
}
export enum XPostType {
    DriverWin = "DriverWin",
    IncomeTip = "IncomeTip",
    TaskOutcome = "TaskOutcome",
    SAIntelligence = "SAIntelligence"
}
export interface backendInterface {
    addCustomEvent(event: Event): Promise<void>;
    addDocumentNote(docId: string, note: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addDriverMemoryEntry(entry: DriverMemoryEntry): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addExpense(expense: ExpenseEntry): Promise<void>;
    addFleetExpense(vehicleId: string, category: string, amount: number, date: bigint, notes: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFleetIncome(vehicleId: string, platform: string, amount: number, date: bigint, notes: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFleetVehicle(plateNumber: string, make: string, model: string, year: bigint | null, color: string | null, notes: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addFuelLog(fuelLog: FuelLog): Promise<void>;
    addOrUpdateProduct(product: Product): Promise<void>;
    addOrUpdateShift(shift: Shift): Promise<void>;
    addSale(sale: Sale): Promise<void>;
    addTrip(trip: Trip): Promise<void>;
    adminListAllDocuments(): Promise<Array<DocumentRecord>>;
    applyReferralCode(code: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    applyReferralCreditToPayment(subscriptionPrice: number): Promise<{
        remainingBalance: number;
        amountDue: number;
        creditApplied: number;
    }>;
    approveCampaign(campaignId: string, scheduledFor: bigint | null): Promise<{
        __kind__: "ok";
        ok: Campaign;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buildAdvertisingBusinessCase(): Promise<string>;
    checkAbTestResults(): Promise<Array<AbTestResult>>;
    claimZeroXWorkTask(taskId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: clear (disable) the Cloudflare AI Gateway — reverts to direct calls.
     */
    clearAIGatewayConfig(): Promise<void>;
    clearAgentConversation(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createForumPost(channel: ForumChannel, text: string, isAnonymous: boolean, voiceNoteKey: string | null, parentId: ForumPostId | null): Promise<{
        __kind__: "ok";
        ok: ForumPost;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createOrUpdateProfile(profile: UserProfile): Promise<void>;
    createPitch(pitch: CompanyPitch): Promise<string>;
    createVideoPost(clipId: string, platform: SocialPlatform, scheduledAt: bigint | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createVideoUpload(storageRef: string, fileName: string, fileSizeBytes: bigint, contentType: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteCustomEvent(eventId: string): Promise<void>;
    deleteDocument(docId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteExpense(expenseId: string): Promise<void>;
    deleteFleetExpense(expenseId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteFleetIncome(incomeId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteFleetVehicle(vehicleId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteForumPost(postId: ForumPostId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePassengerOrder(orderId: string): Promise<void>;
    deletePitch(id: string): Promise<boolean>;
    deleteProduct(productId: string): Promise<void>;
    deleteSale(saleId: string): Promise<void>;
    deleteShift(shiftId: string): Promise<void>;
    deleteStakingRecord(stakeId: string): Promise<void>;
    deleteTrip(tripId: string): Promise<void>;
    detectSurgeOpportunities(): Promise<string>;
    dismissOpportunity(findingId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    elevenLabsTextToSpeech(text: string): Promise<Uint8Array>;
    fetchAndStoreAnalytics(): Promise<void>;
    fetchAndStoreSAEvents(forceRefresh: boolean): Promise<{
        __kind__: "ok";
        ok: Array<FetchedEvent>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    flagForumPost(postId: ForumPostId, reason: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateDriverWebsite(topic: string): Promise<Result_1>;
    generateFollowUpReminders(driverId: string): Promise<Array<string>>;
    generateHyperframesSlideshow(topic: string): Promise<{
        __kind__: "ok";
        ok: HyperframesJob;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generatePresentation(input: PresentationInput): Promise<{
        __kind__: "ok";
        ok: PresentationData;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateSystemPromptDelta(insights: MonthlyInsights): Promise<string>;
    generateWeeklyReport(): Promise<WeeklyReport>;
    get0xWorkEarnings(): Promise<ZeroXWorkEarnings>;
    get0xWorkStatus(): Promise<ZeroXWorkStatus>;
    /**
     * / Returns gateway configuration status. Never returns the API key.
     */
    getAIGatewayStatus(): Promise<{
        url?: string;
        configured: boolean;
    }>;
    getAllReferrals(): Promise<Array<ReferralUse>>;
    /**
     * / Admin only: returns aggregated analytics summary.
     */
    getAnalyticsSummary(): Promise<AnalyticsSummary>;
    /**
     * / Admin only: returns true if Brian API key is configured and non-empty.
     */
    getBrianApiKeyStatus(): Promise<boolean>;
    /**
     * / Admin only: returns true if CMC API key is configured and non-empty.
     */
    getCMCApiKeyStatus(): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCampaignConfig(): Promise<CampaignConfig>;
    getCampaignFailureLog(): Promise<Array<CampaignFailureLog>>;
    getCampaignMetrics(campaignId: string): Promise<{
        __kind__: "ok";
        ok: CampaignMetrics;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCohortStats(): Promise<{
        powerEarners: bigint;
        growthDrivers: bigint;
        newDrivers: bigint;
    }>;
    getCompetitiveStats(): Promise<CompetitiveStats>;
    getContextSummary(): Promise<string>;
    getCustomEvents(): Promise<Array<Event>>;
    getDocVaultConfig(): Promise<{
        notesEnabled: boolean;
    }>;
    getDocumentMarkdown(storageRef: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Caller sees their own events; admin can pass any driverId.
     * / Limit is capped at 100 to avoid large responses.
     */
    getDriverAnalyticsEvents(driverId: string, limit: bigint): Promise<Array<AnalyticsEvent>>;
    getDriverAnalyticsProfile(): Promise<DriverAnalyticsProfile | null>;
    getDriverCohortProfile(): Promise<DriverCohortProfile>;
    getDriverCreditBalance(driverId: string): Promise<number>;
    getDriverEarningsSnapshot(): Promise<string>;
    getDriverLeadBatch(weekNumber: bigint, year: bigint): Promise<LeadBatch | null>;
    getDriverLeads(weekNumber: bigint | null, year: bigint | null): Promise<Array<ScrapedLead>>;
    getDriverMemory(): Promise<DriverMemory | null>;
    getDriverMemoryEntries(): Promise<Array<DriverMemoryEntry>>;
    getDriverOpportunities(limit: bigint): Promise<Array<OpportunityFinding>>;
    getDriverOutcomesV2(driverId: string): Promise<Array<RecommendationOutcomeV2>>;
    getDriverPitches(driverId: string): Promise<Array<CompanyPitch>>;
    getDriverProfileSummary(): Promise<string>;
    getDriverRating(): Promise<number>;
    getEarningsGoal(): Promise<EarningsGoal | null>;
    getEarningsTotal(): Promise<[number, bigint]>;
    getElevenLabsSignedUrl(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getEmailConfig(): Promise<AgentMailConfig>;
    getEmailLogs(): Promise<Array<EmailLog>>;
    /**
     * / Admin only: returns the last `limit` error events (success=false).
     */
    getErrorLog(limit: bigint): Promise<Array<AnalyticsEvent>>;
    getEventRelevanceScore(eventTitle: string, eventDate: bigint): Promise<string>;
    getEventsWithTavilyIntelligence(city: string): Promise<{
        __kind__: "ok";
        ok: Array<EventIntelligence>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: returns a masked preview of the Exa API key.
     * / Shows first 6 characters followed by "***", or "***" if short/empty.
     */
    getExaApiKey(): Promise<string>;
    getExpenses(): Promise<Array<ExpenseEntry>>;
    getExposureMetrics(zone: SAZone): Promise<ExposureMetrics>;
    getExposureMetricsWithTrips(zone: SAZone, tripsPerMonth: bigint): Promise<ExposureMetrics>;
    getFetchedEvents(): Promise<Array<FetchedEvent>>;
    getFleetExpenses(vehicleId: string | null): Promise<Array<FleetExpenseEntry>>;
    getFleetIncome(vehicleId: string | null): Promise<Array<FleetIncomeEntry>>;
    getFleetSummary(): Promise<Array<FleetVehicleSummary>>;
    getFleetVehicles(): Promise<Array<FleetVehicle>>;
    getForumAdminStats(): Promise<{
        flaggedPosts: Array<ForumPost>;
        topContributors: Array<[string, bigint]>;
        totalPosts: bigint;
        postsPerChannel: Array<[string, bigint]>;
    }>;
    getForumPost(id: ForumPostId): Promise<ForumPost | null>;
    getForumPosts(channel: ForumChannel, offset: bigint, limit: bigint): Promise<ForumPage>;
    getForumReplies(parentId: ForumPostId, offset: bigint, limit: bigint): Promise<ForumPage>;
    getFuelLogs(): Promise<Array<FuelLog>>;
    getFuelProfile(): Promise<{
        vehicleName: string;
        fuelConsumptionRate: number;
    }>;
    /**
     * / Admin only: returns current cache hit rate as a percentage (0.0–1.0).
     */
    getGatewayCacheHitRate(): Promise<number>;
    /**
     * / Admin only: returns latency percentiles (p50/p95/p99) from the rolling sample buffer.
     */
    getGatewayLatencyPercentiles(): Promise<LatencyPercentiles>;
    /**
     * / Admin only: returns aggregated gateway metrics summary.
     */
    getGatewayMetricsSummary(): Promise<Summary>;
    /**
     * / Admin only: returns the last `limit` gateway metric entries.
     */
    getGatewayRecentEntries(limit: bigint): Promise<Array<MetricEntry>>;
    /**
     * / Admin only: returns the top 5 busiest hours by request count.
     */
    getGatewayTopHours(): Promise<Array<[string, bigint]>>;
    getHyperframesConfig(): Promise<{
        configured: boolean;
    }>;
    getHyperframesJob(id: string): Promise<HyperframesJob | null>;
    getHyperframesJobs(): Promise<Array<HyperframesJob>>;
    getICPPrice(): Promise<string>;
    getLeadAuditLog(): Promise<Array<ScraperAuditLog>>;
    getLowStockProducts(): Promise<Array<Product>>;
    getMonthOutcomes(driverId: string, year: bigint, month: bigint): Promise<Array<RecommendationOutcomeV2>>;
    getMyCompetitiveProfile(): Promise<DriverCompetitiveProfile | null>;
    getMyPaymentConfig(): Promise<DriverPaymentConfig | null>;
    getMyReferralCode(): Promise<ReferralCode>;
    getMyReferralCredit(): Promise<number>;
    getMyRouteOptIn(): Promise<RouteOptIn | null>;
    getMySnapScanMerchantId(): Promise<string | null>;
    getNdunaInboxId(): Promise<string | null>;
    getNdunaInboxMessages(): Promise<Array<NdunaEmail>>;
    getNdunaPromptState(): Promise<NdunaSystemPromptState>;
    getOpenClawModel(): Promise<string>;
    getOpportunityHunterStatus(): Promise<{
        configured: boolean;
        lastError: string;
        lastRun: bigint;
    }>;
    /**
     * / Admin only: returns true if the Orbis API key is configured and non-empty.
     */
    getOrbisApiKeyStatus(): Promise<boolean>;
    getOrbisPublisherStatus(): Promise<OrbisListingStatus>;
    getOutcomeStats(driverId: string, year: bigint, month: bigint): Promise<OutcomeStats>;
    getOutcomeV2(recommendationId: string): Promise<RecommendationOutcomeV2 | null>;
    getPassengerOrders(): Promise<Array<PassengerOrder>>;
    /**
     * / Returns the current pilot mode status. Public query — readable by the frontend.
     */
    getPilotMode(): Promise<boolean>;
    getPitch(id: string): Promise<CompanyPitch | null>;
    getPitchesByStatus(driverId: string, status: PitchStatus): Promise<Array<CompanyPitch>>;
    getPostingSchedule(): Promise<PostingSchedule | null>;
    getPresentation(shareToken: string): Promise<PresentationData | null>;
    getProactiveTriggers(): Promise<Array<ProactiveTrigger>>;
    getProducts(): Promise<Array<Product>>;
    getPublicDriverMenu(driverName: string): Promise<Array<Product>>;
    getPublicDriverPaymentConfig(driverName: string): Promise<DriverPaymentConfig | null>;
    /**
     * / Admin only: returns the last `limit` events across all drivers (newest first).
     */
    getRecentAnalyticsEvents(limit: bigint): Promise<Array<AnalyticsEvent>>;
    getReferralConfig(): Promise<ReferralConfig>;
    getReferralStats(): Promise<{
        totalEarned: number;
        pendingBonus: number;
        timesUsed: bigint;
    }>;
    getRemainingNdunaQueries(): Promise<bigint>;
    getSAIntelligence(req: IntelligenceQuery): Promise<{
        __kind__: "ok";
        ok: IntelligenceResult;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getSales(): Promise<Array<Sale>>;
    getSchedulerConfig(): Promise<SchedulerConfig>;
    getShiftHistory(): Promise<Array<Shift>>;
    getShifts(): Promise<Array<Shift>>;
    getShortsConfig(): Promise<ShortsConfig>;
    getShortsJob(jobId: string): Promise<ShortsJob | null>;
    getSmartRecommendations(): Promise<Array<SmartRecommendation>>;
    getSnapScanMerchantId(): Promise<string>;
    getStakingRecords(): Promise<Array<StakingRecord>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTavilyUsageEstimate(): Promise<bigint>;
    getTierPricing(): Promise<{
        tier1: bigint;
        tier2: bigint;
        tier3: bigint;
    }>;
    getTrips(): Promise<Array<Trip>>;
    /**
     * / Live USDC/ZAR exchange rate from CoinGecko. 10-minute canister cache.
     * / Returns raw JSON: {"usd-coin":{"zar":18.52}} or a plain float string on cache hit.
     */
    getUSDCZARRate(): Promise<string>;
    getUnreadWhatsAppCount(): Promise<bigint>;
    getUpcomingShifts(): Promise<Array<Shift>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoAnalytics(postId: string): Promise<Array<VideoAnalytics>>;
    getVideoBrandingConfig(): Promise<BrandingConfig | null>;
    getVideoClip(clipId: string): Promise<VideoClip | null>;
    getVideoClips(uploadId: string): Promise<Array<VideoClip>>;
    getVideoJobStatus(uploadId: string): Promise<VideoJobStatus | null>;
    getVideoPosts(clipId: string): Promise<Array<VideoPost>>;
    getVideoUpload(uploadId: string): Promise<VideoUpload | null>;
    getVideoUploads(): Promise<Array<VideoUpload>>;
    getVoiceUsage(): Promise<VoiceUsage>;
    getWebsiteBuilderRateLimit(): Promise<bigint>;
    getWebsiteJob(jobId: string): Promise<WebsiteJob | null>;
    getWebsiteJobs(): Promise<Array<WebsiteJob>>;
    getWeeklyBriefingState(): Promise<WeeklyBriefingState>;
    getWhatsAppConfig(): Promise<WhatsAppConfig | null>;
    getWhatsAppHistory(limit: bigint | null, before: bigint | null): Promise<Array<WhatsAppConversationEntry>>;
    getXPostingConfig(): Promise<XPostingConfig>;
    getXPostingStatus(): Promise<{
        earningsCents: bigint;
        totalPosts: bigint;
        isUnlocked: boolean;
        progressPct: bigint;
        thresholdCents: bigint;
    }>;
    getXPosts(limit: bigint, offset: bigint): Promise<Array<XPost>>;
    getZeroXWorkTasks(): Promise<Array<ZeroXWorkTask>>;
    handleSnapScanWebhook(payload: string, signature: string): Promise<string>;
    hasLikedForumPost(postId: ForumPostId): Promise<boolean>;
    incrementVoiceUsage(): Promise<bigint>;
    isBrowserbaseConfigured(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCamofoxConfigured(): Promise<boolean>;
    isElevenLabsConfigured(): Promise<boolean>;
    isOpenClawConfigured(): Promise<boolean>;
    isOpportunityHunterConfigured(): Promise<boolean>;
    isSnapScanConfigured(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isTavilyConfigured(): Promise<boolean>;
    isUploadPostConfigured(): Promise<boolean>;
    isWhatsAppConfigured(): Promise<boolean>;
    isZeroXWorkRegistered(): Promise<boolean>;
    iterateDriverWebsite(jobId: string, instruction: string): Promise<Result_1>;
    likeForumPost(postId: ForumPostId): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    listCampaigns(status: CampaignStatus | null): Promise<Array<Campaign>>;
    listDriverDocuments(): Promise<Array<DocumentRecord>>;
    listShortsJobs(): Promise<Array<ShortsJob>>;
    logBehavioralEvent(eventType: string, page: string, details: string, timestamp: bigint): Promise<void>;
    logOutcomeEvent(recommendationId: string, outcome: string): Promise<void>;
    logPassengerOrder(driverName: string, order: PassengerOrder): Promise<void>;
    logRecommendation(rec: NdunaRecommendation): Promise<bigint>;
    logRecommendationV2(rec: NdunaRecommendationV2): Promise<string>;
    markEventsAsRead(): Promise<void>;
    monthlyAnalysis(driverId: string, year: bigint, month: bigint): Promise<MonthlyInsights>;
    monthlyPromptEvolution(): Promise<string>;
    pauseAllCampaigns(): Promise<boolean>;
    proposeCampaign(): Promise<{
        __kind__: "ok";
        ok: Campaign;
    } | {
        __kind__: "err";
        err: string;
    }>;
    provisionNdunaInbox(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    publishDriverWebsite(jobId: string): Promise<Result>;
    queryAIAgent(message: string, contextData: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    queryDocumentsByType(docType: string): Promise<Array<DocumentRecord>>;
    recalculateDriverProfile(): Promise<DriverAnalyticsProfile>;
    receiveWhatsAppWebhook(payload: string, signature: string): Promise<string>;
    recordConversion(campaignId: string, driverId: string, eventType: string): Promise<boolean>;
    recordExposureOutcome(estimatedExposure: bigint, actualDealValue: bigint): Promise<void>;
    recordOutcome(recId: bigint, outcome: RecommendationOutcome): Promise<boolean>;
    recordOutcomeV2(outcome: RecommendationOutcomeV2): Promise<boolean>;
    registerWhatsAppPhone(phone: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectCampaign(campaignId: string, reason: string): Promise<{
        __kind__: "ok";
        ok: Campaign;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestChanges(campaignId: string, notes: string): Promise<{
        __kind__: "ok";
        ok: Campaign;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestMarkdownConversion(storageRef: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetAllDriverMemory(): Promise<void>;
    /**
     * / Admin only: reset all driver rate limit counters manually.
     */
    resetAllRateLimits(): Promise<void>;
    resetNdunaEvolution(): Promise<void>;
    resumeAllCampaigns(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDriverPaymentConfig(config: DriverPaymentConfig): Promise<void>;
    saveFuelProfile(fuelConsumptionRate: number, vehicleName: string): Promise<void>;
    saveMySnapScanMerchantId(merchantId: string): Promise<void>;
    savePostingSchedule(schedule: PostingSchedule): Promise<void>;
    saveStakingRecord(record: StakingRecord): Promise<void>;
    saveVideoBrandingConfig(config: BrandingConfig): Promise<void>;
    sendLeadFollowupEmail(companyEmail: string, companyName: string, driverName: string, followupDay: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendOnboardingEmail(driverEmail: string, dayNumber: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendPitchEmail(companyEmail: string, companyName: string, pitchContent: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendWebsiteByEmail(jobId: string, websiteHtml: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendWeeklyBriefingEmail(driverEmail: string, briefingContent: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendWhatsAppMessage(toPhone: string, body: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: set both Cloudflare AI Gateway URL and key in one call.
     */
    setAIGatewayConfig(url: string, key: string): Promise<void>;
    /**
     * / Admin only: set the Cloudflare AI Gateway API key.
     */
    setAIGatewayKey(key: string): Promise<void>;
    /**
     * / Admin only: set the Cloudflare AI Gateway URL.
     */
    setAIGatewayUrl(url: string): Promise<void>;
    setAgentMailApiKey(key: string): Promise<void>;
    /**
     * / Admin only: set Brian API key for natural language transaction guides.
     */
    setBrianApiKey(key: string): Promise<void>;
    setBrowserbaseConfig(apiKey: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: set CoinMarketCap API key for Fear & Greed index.
     */
    setCMCApiKey(key: string): Promise<void>;
    setCamofoxBaseUrl(url: string): Promise<void>;
    setCampaignConfig(config: CampaignConfig): Promise<boolean>;
    setDocVaultNotesEnabled(enabled: boolean): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setDriverRouteOptIn(primaryRoute: SAZone, secondaryRoute: SAZone | null): Promise<void>;
    setEarningsGoal(goal: EarningsGoal): Promise<void>;
    setElevenLabsApiKey(key: string): Promise<void>;
    /**
     * / Admin only: store the Exa API key securely in the canister.
     * / Never returned in plain text — use getExaApiKey for a masked preview.
     */
    setExaApiKey(key: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setGoogleMapsApiKey(key: string): Promise<void>;
    setHermesConfig(openRouterKey: string, tavilyKey: string, model: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setHyperframesVpsKey(key: string): Promise<void>;
    setHyperframesVpsUrl(url: string): Promise<void>;
    setLeadFollowupEmailEnabled(enabled: boolean): Promise<void>;
    setOnboardingEmailEnabled(enabled: boolean): Promise<void>;
    setOpenClawApiKey(key: string, apiUrl: string, model: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setOpportunityHunterConfig(url: string, key: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: set the Orbis API key (enables PQS pre-flight + Orbis LLM fallback).
     * / Set to empty string to disable both features.
     */
    setOrbisApiKey(key: string): Promise<void>;
    setOrbisPublisherConfig(config: OrbisListingConfig): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: enable or disable pilot mode.
     * / When pilot mode is on, all paid third-party outcalls are skipped (ElevenLabs,
     * / Whisper, Camofox, Upload-Post, 360dialog paid templates, Tavily paid tier) and
     * / OpenRouter is restricted to free-tier models only.
     */
    setPilotMode(enabled: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setReferralConfig(config: ReferralConfig): Promise<void>;
    setSchedulerConfig(config: SchedulerConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setShortsVpsConfig(vpsUrl: string, vpsKey: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSnapScanConfig(merchantApiKey: string, webhookSecret: string, merchantId: string): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setTavilyApiKey(key: string): Promise<void>;
    setTomTomApiKey(key: string): Promise<void>;
    setUploadPostConfig(config: UploadPostConfig): Promise<void>;
    setVideoWhisperConfig(config: WhisperConfig__1): Promise<void>;
    setWeeklyBriefingEmailEnabled(enabled: boolean): Promise<void>;
    setWeeklyBriefingEnabled(enabled: boolean): Promise<void>;
    setWhatsAppConfig(config: WhatsAppConfig): Promise<void>;
    setWhisperConfig(config: WhisperConfig): Promise<void>;
    setXApiKeys(xApiKey: string, xApiSecret: string, xAccessToken: string, xAccessTokenSecret: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setXEarningsThreshold(thresholdUsd: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitShortsJob(req: ShortsRequest): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitZeroXWorkTask(taskId: string, deliverable: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sync0xWorkEarnings(): Promise<{
        __kind__: "ok";
        ok: ZeroXWorkEarnings;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: sync 0xWork earnings AND update the X posting threshold tracker.
     * / Wraps sync0xWorkEarnings() and then calls updateMonthlyXEarnings() with the
     * / latest cumulative USDC converted to cents (1 USDC = 100 cents).
     */
    syncEarningsAndXThreshold(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    syncXPostMetrics(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    tavilySearch(searchQuery: string, searchContext: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: test the stored Exa API key by running a company research query.
     * / Returns a summary string (company name + snippet) on success, or an error message.
     */
    testExaCompanyResearch(searchQuery: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    trigger0xWorkRegistration(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerBrowserbaseHunt(driverPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerLeadRefresh(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerNdunaXPost(postType: XPostType): Promise<{
        __kind__: "ok";
        ok: XPost;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerOpportunityHunt(driverId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin only: trigger Orbis agent self-registration.
     * / Calls the Orbis discovery → register → subscribe flow and stores the returned
     * / sk_... API key into orbisApiKeyStore automatically on success.
     */
    triggerOrbisRegistration(email: string, password: string, username: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerReferralBonus(newDriverId: string): Promise<string | null>;
    triggerTaskDiscovery(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerVideoProcessing(uploadId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    triggerWeeklyBriefings(): Promise<{
        sent: bigint;
        failed: bigint;
    }>;
    updateDriverMemory(notes: string, userProfile: string): Promise<void>;
    updateDriverRating(rating: number): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateLeadStatus(leadId: string, status: LeadStatus): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMarkdownContent(storageRef: string, content: string | null, status: MarkdownStatus): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateMonthlyXEarnings(earningsCents: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateNdunaSystemPrompt(delta: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updatePitch(id: string, updated: CompanyPitch): Promise<boolean>;
    updatePitchStatus(id: string, status: PitchStatus): Promise<boolean>;
    updateShortsJobStatus(jobId: string, status: ShortsStatus, outputUrl: string | null, errorMsg: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadDocument(storageRef: string, docType: DocumentType, fileName: string, notes: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    upsertCompetitiveProfile(city: string, surgeAccuracy: number, dealsClosed: bigint, avgDealValue: bigint): Promise<void>;
}
