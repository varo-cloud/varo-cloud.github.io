import { http, clearToken, unwrap } from './http'
import type { AuthResult, LoginPayload, RegisterPayload, UserProfile } from '@/types'

export function login(payload: LoginPayload) {
  return unwrap<AuthResult>(http.post('/auth/login', payload))
}

export function register(payload: RegisterPayload) {
  return unwrap<AuthResult>(http.post('/auth/register', payload))
}

export function fetchUserProfile() {
  return unwrap<UserProfile>(http.get('/user/profile'))
}

export function logout() {
  clearToken()
}
