export type {
  InputSchema,
  SchemaFormValues,
  SchemaProperty,
  ResolvedSchemaField,
  SchemaWidget,
} from './schema'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type ModelCategory = 'video' | 'image' | 'llm'

export interface Model {
  /** Catalog slug, e.g. `seedance-2.0/text-to-video` — maps from API `slug` */
  id: string
  /** Base model seq_id — maps from API `model_id` (int) */
  baseModelId: number
  /** Single capability label, e.g. `text-to-video` — maps from API `capability` */
  capability: string
  category: ModelCategory
  /** Maps from API field `display_name` */
  displayName: string
  /** Maps from API field `starting_price_usd` — unit rate in USD */
  startingPriceUsd: number
  /** Maps from API field `standard_price_usd` — strikethrough reference price */
  originalPriceUsd?: number
  /** Maps from API field `price_unit` */
  priceUnit: PricingPriceUnit
  /** Maps from API field `price_detail` — optional run context; for per_second, resolution only e.g. "720p" */
  priceDetail?: string
  description: string
  /** Maps from API field `thumbnail_url` */
  thumbnailUrl?: string
  /** Maps from API field `icon_url` — brand icon beside card title */
  iconUrl?: string
  /** Maps from API field `is_hot` */
  isHot?: boolean
  /** Maps from API field `is_new` */
  isNew?: boolean
  /** Maps from API field `sort_order` */
  sortOrder?: number
}

export interface ModelDetail extends Model {
  /** Maps from API field `readme_md` — model README rendered in API tab */
  readmeMd?: string
  /** Maps from API field `faq` */
  faq?: ModelFaqItem[]
  /** Maps from API field `input_schema` */
  inputSchema?: Record<string, unknown> | null
}

export interface ModelFaqItem {
  question: string
  answer: string
}

export interface ModelsPage {
  items: Model[]
  total: number
  offset: number
  limit: number
}

export interface FetchModelsParams {
  offset?: number
  limit?: number
  q?: string
}

export interface ModelRecentEntry {
  id: string
  visitedAt: number
}

export interface ModelPreferences {
  favourites: string[]
  recent: ModelRecentEntry[]
}

export type UserRole = 'user' | 'admin'

export interface UserProfile {
  id: string
  email: string
  /** Derived from email local-part when API does not return a display name */
  name: string
  role: UserRole
  /** USD balance — maps from API field `balance_usd` */
  balanceUsd: number
  /** Maps from API field `created_at` — 13-digit Unix timestamp (ms) */
  createdAt: number
}

export interface OtpRequestPayload {
  email: string
  /** Cloudflare Turnstile token from widget — backend field `turnstile_token` */
  turnstile_token: string
}

export interface OtpRequestResult {
  sent: boolean
}

export interface OtpVerifyPayload {
  email: string
  code: string
  /** Cloudflare Turnstile token from widget — backend field `turnstile_token` */
  turnstile_token: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface RefreshTokenPayload {
  refresh_token: string
}

export interface LogoutPayload {
  refresh_token: string
}

export interface LogoutResult {
  revoked: boolean
}

export type ApiKeyStatus = 'active' | 'revoked'

export interface ApiKey {
  id: string
  /** User-defined label; maps from API `name` when present, else falls back to `prefix` */
  name: string
  /** Masked key for display; `{prefix}******` from API `prefix` */
  keyMasked: string
  /** Unix ms; maps from API `created_at` */
  createdAt: number
  /** Maps from API `is_active` */
  status: ApiKeyStatus
  /** Per-key call count; backend field TBD — defaults to 0 */
  totalCalls: number
  /** Per-key spend; backend field TBD — defaults to 0 */
  totalSpendUsd: number
  /** Unix ms; maps from API `last_used_at` — defaults to null */
  lastUsedAt: number | null
}

export interface CreateApiKeyResult {
  id: string
  /** Client-side name; backend create response does not include `name` yet */
  name: string
  /** Full key; maps from API `key` — shown only once */
  key: string
  /** Unix ms; maps from API `created_at` */
  createdAt: number
}

export type TransactionType = 'topup' | 'usage'

export type TopUpTransactionStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'partial'

export type TransactionProvider = 'stripe' | 'nowpayments'

export interface Transaction {
  id: string
  type: TransactionType
  amountUsd: number
  description: string
  createdAt: number
  status?: TopUpTransactionStatus
  provider?: TransactionProvider
  paymentMethod?: string | null
  paymentDetail?: string | null
  completedAt?: number | null
  receiptUrl?: string | null
  feeUsd?: number | null
}

export interface BalanceInfo {
  balanceUsd: number
}

export interface BillingAutoTopUp {
  enabled: boolean
  thresholdUsd: number
  topUpAmountUsd: number
}

export interface BillingSummary {
  balanceUsd: number
  spentThisMonthUsd: number
  spentChangePercent: number
  autoTopUp: BillingAutoTopUp
}

export interface TopUpPreset {
  amountUsd: number
  bonusPercent?: number
  usageHint: string
}

export type CreditPackageId = 'starter' | 'pro' | 'business'

export type TopUpSelectionId = CreditPackageId | 'custom'

export interface CreditPackage {
  id: CreditPackageId
  label: string
  priceUsd: number
}

export interface BillingConfig {
  publishableKey: string
  cryptoEnabled: boolean
}

export interface CreateCheckoutPayload {
  amountUsd: number
  presetId?: string | null
  /** Stripe checkout only; omit for Alipay / WeChat Pay on Stripe hosted page */
  paymentMethod?: 'card'
}

export interface CheckoutSessionResult {
  checkoutUrl: string
}

/** `''` = Alipay / WeChat Pay (no payment_method in checkout request) */
export type PaymentMethodId = 'card' | '' | 'crypto'

export interface CreateTopUpPayload {
  amountUsd: number
  paymentMethod: PaymentMethodId
}

export interface UpdateAutoTopUpPayload {
  enabled: boolean
  thresholdUsd: number
  topUpAmountUsd: number
}

export type BillingRecordStyle = 'api' | 'web' | 'topup' | 'bonus'

export interface BillingRecord {
  id: string
  style: BillingRecordStyle
  /** Usage or payment detail, e.g. model · resolution · duration */
  key: string
  /** Masked API Key when style is `api`; empty for web and other types */
  apiKey?: string | null
  amountUsd: number
  createdAt: number
}

export type PricingCategory = 'image-video' | 'language' | 'serverless'

export type PricingMediaType = 'video' | 'image' | 'llm'

/** Maps from API field `price_unit` */
export type PricingPriceUnit = 'per_second' | 'per_image' | 'per_million_tokens' | 'per_hour'

export interface PricingItem {
  /** Slug — maps from API `id` */
  id: string
  /** Slug — maps from API `model_id` (same as `id`) */
  modelId: string
  /** Maps from API `name` (`display_name`) */
  name: string
  /** Maps from API field `standard_price_usd` */
  standardPriceUsd: number
  /** Maps from API field `starting_price_usd` */
  startingPriceUsd: number
  priceUnit: PricingPriceUnit
}

export type UploadKind = 'image' | 'video' | 'audio'

export interface UploadResult {
  url: string
  filename: string
  mimeType: string
  size: number
}

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export interface PlaygroundGenerationResult {
  id: string
  object: 'generation'
  status: 'completed' | 'failed'
  model: string
  created_at: number
  output: {
    type: 'image' | 'video'
    url: string
  }
  usage?: {
    cost_usd: number
  }
}

export interface PlaygroundQuote {
  cost_usd: number
}

export interface PlaygroundQuotePayload {
  input: Record<string, unknown>
}
