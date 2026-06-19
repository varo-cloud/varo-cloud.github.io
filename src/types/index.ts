export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Model {
  id: string
  name: string
  displayName?: string
  provider: string
  capabilities: string[]
  startingPriceUsd: number
  originalPriceUsd?: number
  priceDetail?: string
  discountPercent?: number
  description: string
  thumbnailUrl?: string
}

export interface ModelDetail extends Model {
  parameters: ModelParameter[]
}

export interface ModelParameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  balanceUsd: number
}

export interface AuthResult {
  token: string
  user: UserProfile
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
}

export type ApiKeyStatus = 'active' | 'revoked'

export interface ApiKey {
  id: string
  name: string
  keyMasked: string
  createdAt: string
  status: ApiKeyStatus
  totalCalls: number
  totalSpendUsd: number
  lastUsedAt: string | null
}

export interface CreateApiKeyResult {
  id: string
  name: string
  key: string
  createdAt: string
}

export type TransactionType = 'topup' | 'usage'

export interface Transaction {
  id: string
  type: TransactionType
  amountUsd: number
  description: string
  createdAt: string
}

export interface BalanceInfo {
  balanceUsd: number
}
