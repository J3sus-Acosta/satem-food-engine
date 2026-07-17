import { vi } from 'vitest'

// Mock server-only module to prevent Vitest import errors in tests
vi.mock('server-only', () => ({}))
