import { http, unwrap } from './http'
import type {
  BillingSummary,
  CreateTopUpPayload,
  BillingRecord,
  TopUpPreset,
  Transaction,
  UpdateAutoTopUpPayload,
} from '@/types'

export function fetchBillingSummary() {
  return unwrap<BillingSummary>(http.get('/billing/summary'))
}

export function fetchTopUpPresets() {
  return unwrap<TopUpPreset[]>(http.get('/billing/top-up-presets'))
}

export function fetchTransactions() {
  return unwrap<Transaction[]>(http.get('/billing/transactions'))
}

export function fetchBillingRecords() {
  return unwrap<BillingRecord[]>(http.get('/billing/records'))
}

export function createTopUp(payload: CreateTopUpPayload) {
  return unwrap<Transaction>(http.post('/billing/top-up', payload))
}

export function updateAutoTopUp(payload: UpdateAutoTopUpPayload) {
  return unwrap<BillingSummary['autoTopUp']>(http.post('/billing/auto-top-up', payload))
}
