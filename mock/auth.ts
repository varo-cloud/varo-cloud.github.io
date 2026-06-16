import type { MockMethod } from 'vite-plugin-mock'
import { fail, success } from './_util'

const mockUser = {
  id: 'user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  balanceUsd: 68.13,
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: { email: string; password: string } }) => {
      if (!body.email || !body.password) {
        return fail('Email and password are required')
      }
      return success({
        token: `mock_token_${Date.now()}`,
        user: { ...mockUser, email: body.email },
      })
    },
  },
  {
    url: '/api/auth/register',
    method: 'post',
    response: ({ body }: { body: { email: string; password: string; name: string } }) => {
      if (!body.email || !body.password || !body.name) {
        return fail('All fields are required')
      }
      return success({
        token: `mock_token_${Date.now()}`,
        user: {
          id: `user-${Date.now()}`,
          email: body.email,
          name: body.name,
          balanceUsd: 2.0,
        },
      })
    },
  },
  {
    url: '/api/user/profile',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const auth = headers.authorization || headers.Authorization
      if (!auth) {
        return { code: 401, message: 'Unauthorized', data: null }
      }
      return success(mockUser)
    },
  },
] as MockMethod[]
