import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock performance.now for timing tests
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now())
}

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock WebSocket for real-time tests
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1
}))

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    section: 'section',
    article: 'article',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
  useTransform: () => vi.fn(),
  useSpring: () => vi.fn(),
}))

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: 'div',
  Line: 'div',
  XAxis: 'div',
  YAxis: 'div',
  CartesianGrid: 'div',
  Tooltip: 'div',
  Legend: 'div',
  ResponsiveContainer: ({ children }) => children,
  BarChart: 'div',
  Bar: 'div',
  PieChart: 'div',
  Pie: 'div',
  Cell: 'div',
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const MockIcon = () => 'svg'
  return new Proxy({}, {
    get: () => MockIcon,
  })
})

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  tensor: vi.fn(),
  sequential: vi.fn(),
  layers: {
    dense: vi.fn(),
    dropout: vi.fn(),
  },
  train: {
    adam: vi.fn(),
  },
  losses: {
    meanSquaredError: vi.fn(),
  },
  metrics: {
    accuracy: vi.fn(),
  },
  loadLayersModel: vi.fn(),
  ready: vi.fn().mockResolvedValue(true),
}))

// Setup test utilities
export const mockThreatData = {
  totalThreats: 127,
  blockedThreats: 124,
  snnProcessingTime: 0.8,
  annAccuracy: 94.2,
  systemUptime: 99.9
}

export const mockSystemComponents = [
  { name: 'SNN Anomaly Detector', load: 67, status: 'active', type: 'neural' },
  { name: 'ANN Threat Classifier', load: 82, status: 'active', type: 'neural' },
  { name: 'Edge Security Gateway', load: 45, status: 'active', type: 'gateway' }
]

// Helper functions for testing
export const generateTestPacket = () => ({
  id: Math.random().toString(36),
  data: Math.random().toString(36),
  timestamp: Date.now(),
  size: Math.floor(Math.random() * 1500)
})

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))
