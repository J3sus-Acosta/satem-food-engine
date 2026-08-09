import { vi } from 'vitest'

// Mock server-only module to prevent Vitest import errors in tests
vi.mock('server-only', () => ({}))

// Mock database to prevent real database connections during unit tests
vi.mock('@/server/db', () => ({
  db: {
    location: {
      findFirst: vi.fn().mockResolvedValue({ id: 'loc-1', name: 'Casa Matriz' }),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'user-1', name: 'Operador' }),
    },
  },
}))
