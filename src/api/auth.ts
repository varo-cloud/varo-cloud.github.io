import {
  http,
  clearAuthTokens,
  getRefreshToken,
  setRefreshToken,
  setToken,
  unwrap,
} from './http'
import type {
  LogoutResult,
  OtpRequestPayload,
  OtpRequestResult,
  OtpVerifyPayload,
  TokenPair,
  UserProfile,
} from '@/types'

export function requestOtp(payload: OtpRequestPayload) {
  return unwrap<OtpRequestResult>(http.post('/auth/request-otp', payload))
}

export function verifyOtp(payload: OtpVerifyPayload) {
  return unwrap<TokenPair>(http.post('/auth/verify-otp', payload))
}

export function refreshAuthToken(refreshToken: string) {
  return unwrap<TokenPair>(http.post('/auth/refresh', { refresh_token: refreshToken }))
}

export function revokeRefreshToken(refreshToken: string) {
  return unwrap<LogoutResult>(http.post('/auth/logout', { refresh_token: refreshToken }))
}

export function fetchUserProfile() {
  return unwrap<UserProfile>(http.get('/user/profile'))
}

export function persistTokenPair(tokens: TokenPair) {
  setToken(tokens.access_token)
  setRefreshToken(tokens.refresh_token)
}

export async function logout() {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken)
    } catch {
      // Ignore logout errors — clear local session regardless
    }
  }
  clearAuthTokens()
}
