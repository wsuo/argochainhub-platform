import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-12345',
  },
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock environment variables
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
}))

// Mock useTypewriterEffect hook
vi.mock('@/hooks/useTypewriterEffect', () => ({
  useTypewriterEffect: vi.fn((content: string) => ({
    displayedText: content,
    isTyping: false,
    progress: 1,
  })),
  throttle: vi.fn((fn: Function, delay: number) => fn),
}))

// Mock useErrorHandler hook
vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    parsedError: null,
    hasError: false,
    isPermissionError: false,
    handleError: vi.fn(),
    retry: vi.fn(),
    navigateBack: vi.fn(),
    reset: vi.fn(),
  })),
  useQueryErrorHandler: vi.fn(() => ({
    parsedError: null,
    hasError: false,
    isPermissionError: false,
    handleError: vi.fn(),
    retry: vi.fn(),
    navigateBack: vi.fn(),
    reset: vi.fn(),
  })),
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})