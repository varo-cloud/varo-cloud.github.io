import { http, unwrap } from './http'
import type {
  BillingConfig,
  BillingRecord,
  BillingSummary,
  CheckoutSessionResult,
  CreateCheckoutPayload,
  CreditPackage,
  Transaction,
  TransactionProvider,
  // UpdateAutoTopUpPayload,
} from '@/types'

interface ApiBillingBalance {
  balance_usd?: number
}

interface ApiUsageRecord {
  task_id: string
  model: string
  duration?: number
  cost_usd: number
  status: string
  invocation_channel?: string
  api_key_prefix?: string | null
  created_at?: string | number
}

interface ApiCheckoutResponse {
  checkout_url: string
}

interface ApiBillingSummary {
  balance_usd?: number
  month_spend_usd?: number
  total_topup_usd?: number
  total_spent_usd?: number
  /** @deprecated legacy field */
  spent_this_month_usd?: number
}

interface ApiBillingRecord {
  id: string
  style: string
  key: string
  api_key?: string | null
  amount_usd?: number
  created_at?: string | number
  createdAt?: number
  apiKey?: string | null
  amountUsd?: number
  status?: string | null
}

interface ApiBillingConfig {
  publishable_key?: string
  crypto_enabled?: boolean
}

interface ApiTransaction {
  id: string
  provider?: string
  amount_usd?: number
  status?: string
  created_at?: string | number
  payment_method?: string | null
  payment_detail?: string | null
  completed_at?: string | number | null
  receipt_url?: string | null
  fee_usd?: number | null
  type?: string
  amountUsd?: number
  description?: string
  createdAt?: number
  paymentMethod?: string | null
  paymentDetail?: string | null
  completedAt?: number | null
  receiptUrl?: string | null
  feeUsd?: number | null
  providerCamel?: TransactionProvider
}

function parseTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (!value) return Date.now()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function mapBillingSummary(raw: ApiBillingSummary): BillingSummary {
  return {
    balanceUsd: raw.balance_usd ?? 0,
    monthSpendUsd: raw.month_spend_usd ?? raw.spent_this_month_usd ?? 0,
    totalTopupUsd: raw.total_topup_usd ?? 0,
    totalSpentUsd: raw.total_spent_usd ?? 0,
  }
}

function mapUsageToBillingRecord(raw: ApiUsageRecord): BillingRecord {
  return {
    id: raw.task_id,
    style: raw.invocation_channel ?? 'api',
    key: raw.task_id,
    apiKey: raw.api_key_prefix ? `${raw.api_key_prefix}******` : null,
    amountUsd: -Math.abs(raw.cost_usd),
    createdAt: parseTimestamp(raw.created_at),
    status: raw.status,
  }
}

interface ApiCreditPackage {
  id: string
  label: string
  price_usd: number
}

function mapBillingRecord(raw: ApiBillingRecord): BillingRecord {
  if (raw.amountUsd != null) {
    return {
      id: raw.id,
      style: raw.style as BillingRecord['style'],
      key: raw.key,
      apiKey: raw.apiKey ?? null,
      amountUsd: raw.amountUsd,
      createdAt: raw.createdAt ?? Date.now(),
      status: raw.status ?? null,
    }
  }

  return {
    id: raw.id,
    style: raw.style as BillingRecord['style'],
    key: raw.key,
    apiKey: raw.api_key ?? null,
    amountUsd: raw.amount_usd ?? 0,
    createdAt: parseTimestamp(raw.created_at),
    status: raw.status ?? null,
  }
}

function mapTransactionProvider(value: string | undefined): TransactionProvider | undefined {
  if (value === 'stripe' || value === 'nowpayments') return value
  return undefined
}

function mapTransaction(raw: ApiTransaction): Transaction {
  if (raw.amountUsd != null) {
    return {
      id: raw.id,
      type: (raw.type as Transaction['type']) ?? 'topup',
      amountUsd: raw.amountUsd,
      description: raw.description ?? 'Top Up',
      createdAt: raw.createdAt ?? Date.now(),
      status: raw.status as Transaction['status'],
      provider: raw.providerCamel ?? mapTransactionProvider(raw.provider),
      paymentMethod: raw.paymentMethod ?? null,
      paymentDetail: raw.paymentDetail ?? null,
      completedAt: raw.completedAt ?? null,
      receiptUrl: raw.receiptUrl ?? null,
      feeUsd: raw.feeUsd ?? null,
    }
  }

  return {
    id: raw.id,
    type: 'topup',
    amountUsd: raw.amount_usd ?? 0,
    description: 'Top Up',
    createdAt: parseTimestamp(raw.created_at),
    status: raw.status as Transaction['status'],
    provider: mapTransactionProvider(raw.provider),
    paymentMethod: raw.payment_method ?? null,
    paymentDetail: raw.payment_detail ?? null,
    completedAt: raw.completed_at != null ? parseTimestamp(raw.completed_at) : null,
    receiptUrl: raw.receipt_url ?? null,
    feeUsd: raw.fee_usd ?? null,
  }
}

function mapCreditPackage(raw: ApiCreditPackage): CreditPackage {
  return {
    id: raw.id as CreditPackage['id'],
    label: raw.label,
    priceUsd: raw.price_usd,
  }
}

export function fetchBillingConfig() {
  return unwrap<ApiBillingConfig>(http.get('/billing/config')).then(
    (raw): BillingConfig => ({
      publishableKey: raw.publishable_key ?? '',
      cryptoEnabled: raw.crypto_enabled ?? false,
    }),
  )
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  try {
    const raw = await unwrap<ApiBillingSummary>(http.get('/billing/summary'))
    return mapBillingSummary(raw)
  } catch {
    const balance = await unwrap<ApiBillingBalance>(http.get('/billing/balance'))
    return {
      balanceUsd: balance.balance_usd ?? 0,
      monthSpendUsd: 0,
      totalTopupUsd: 0,
      totalSpentUsd: 0,
    }
  }
}

export function fetchCreditPackages() {
  return unwrap<ApiCreditPackage[]>(http.get('/billing/packages')).then((items) =>
    items.map(mapCreditPackage),
  )
}

export function fetchTransactions() {
  return unwrap<ApiTransaction[]>(http.get('/billing/transactions')).then((items) =>
    items.map(mapTransaction),
  )
}

export async function fetchBillingRecords(): Promise<BillingRecord[]> {
  try {
    const items = await unwrap<ApiBillingRecord[]>(http.get('/billing/records'))
    return items.map(mapBillingRecord)
  } catch {
    return []
  }
}

export function fetchUsageRecords() {
  return unwrap<ApiUsageRecord[]>(http.get('/usage')).then((items) =>
    items.map(mapUsageToBillingRecord),
  )
}

function buildStripeCheckoutBody(payload: CreateCheckoutPayload) {
  return {
    amount_usd: payload.amountUsd,
    ...(payload.presetId ? { preset_id: payload.presetId } : {}),
    ...(payload.paymentMethod ? { payment_method: payload.paymentMethod } : {}),
  }
}

function buildCryptoCheckoutBody(payload: CreateCheckoutPayload) {
  return {
    amount_usd: payload.amountUsd,
    ...(payload.presetId ? { preset_id: payload.presetId } : {}),
  }
}

export function createStripeCheckoutSession(payload: CreateCheckoutPayload) {
  return unwrap<ApiCheckoutResponse>(
    http.post('/billing/stripe/checkout', buildStripeCheckoutBody(payload)),
  ).then(
    (data): CheckoutSessionResult => ({
      checkoutUrl: data.checkout_url,
    }),
  )
}

export function createCryptoCheckoutSession(payload: CreateCheckoutPayload) {
  return unwrap<ApiCheckoutResponse>(
    http.post('/billing/nowpayments/checkout', buildCryptoCheckoutBody(payload)),
  ).then(
    (data): CheckoutSessionResult => ({
      checkoutUrl: data.checkout_url,
    }),
  )
}

/** @deprecated Use createStripeCheckoutSession or createCryptoCheckoutSession */
export function createCheckoutSession(payload: CreateCheckoutPayload) {
  return createStripeCheckoutSession(payload)
}

export function completeMockCheckout(sessionId: string) {
  return unwrap<{ completed: boolean }>(
    http.post('/billing/checkout/mock-complete', { session_id: sessionId }),
  )
}

// export function updateAutoTopUp(payload: UpdateAutoTopUpPayload) {
//   return unwrap<ApiAutoTopUp>(
//     http.post('/billing/auto-top-up', {
//       enabled: payload.enabled,
//       threshold_usd: payload.thresholdUsd,
//       top_up_amount_usd: payload.topUpAmountUsd,
//     }),
//   ).then(mapAutoTopUp)
// }
