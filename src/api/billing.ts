import { http, unwrap } from './http'
import type { BalanceInfo, Transaction } from '@/types'

export function fetchBalance() {
  return unwrap<BalanceInfo>(http.get('/billing/balance'))
}

export function fetchTransactions() {
  return unwrap<Transaction[]>(http.get('/billing/transactions'))
}
