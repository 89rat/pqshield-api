import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App.jsx'

// Mock Recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}))

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

describe('SNN/ANN Edge Security App', () => {
  describe('App Rendering', () => {
    it('should render the main application', () => {
      render(<App />)
      
      expect(screen.getByText('SNN/ANN Edge Security')).toBeInTheDocument()
      expect(screen.getByText('Real-time Neural Network Threat Detection')).toBeInTheDocument()
    })

    it('should display threat metrics', () => {
      render(<App />)
      
      expect(screen.getByText('Total Threats')).toBeInTheDocument()
      expect(screen.getByText('Blocked Threats')).toBeInTheDocument()
      expect(screen.getByText('SNN Processing')).toBeInTheDocument()
      expect(screen.getByText('ANN Accuracy')).toBeInTheDocument()
    })

    it('should show monitoring status badge', () => {
      render(<App />)
      
      expect(screen.getByText('MONITORING')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should have all navigation tabs', () => {
      render(<App />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Architecture')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('should switch to Architecture tab', () => {
      render(<App />)
      
      const architectureTab = screen.getByText('Architecture')
      fireEvent.click(architectureTab)
      
      expect(screen.getByText('System Architecture')).toBeInTheDocument()
    })

    it('should switch to Analytics tab', () => {
      render(<App />)
      
      const analyticsTab = screen.getByText('Analytics')
      fireEvent.click(analyticsTab)
      
      expect(screen.getByText('Neural Network Performance')).toBeInTheDocument()
    })
  })

  describe('Interactive Features', () => {
    it('should handle pause/resume functionality', async () => {
      render(<App />)
      
      const pauseButton = screen.getByText('Pause')
      expect(pauseButton).toBeInTheDocument()
      
      fireEvent.click(pauseButton)
      
      await waitFor(() => {
        expect(screen.getByText('Resume')).toBeInTheDocument()
        expect(screen.getByText('PAUSED')).toBeInTheDocument()
      })
    })

    it('should display system components in architecture view', () => {
      render(<App />)
      
      const architectureTab = screen.getByText('Architecture')
      fireEvent.click(architectureTab)
      
      expect(screen.getByText('SNN Anomaly Detector')).toBeInTheDocument()
      expect(screen.getByText('ANN Threat Classifier')).toBeInTheDocument()
      expect(screen.getByText('Edge Security Gateway')).toBeInTheDocument()
    })
  })

  describe('Data Visualization', () => {
    it('should render threat detection chart', () => {
      render(<App />)
      
      expect(screen.getByText('Real-time Threat Detection')).toBeInTheDocument()
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render neural network performance chart in analytics', () => {
      render(<App />)
      
      const analyticsTab = screen.getByText('Analytics')
      fireEvent.click(analyticsTab)
      
      expect(screen.getByText('Neural Network Performance')).toBeInTheDocument()
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('System Status', () => {
    it('should display system performance metrics', () => {
      render(<App />)
      
      expect(screen.getByText('System Performance')).toBeInTheDocument()
      expect(screen.getByText('SNN Processing')).toBeInTheDocument()
      expect(screen.getByText('ANN Accuracy')).toBeInTheDocument()
      expect(screen.getByText('System Uptime')).toBeInTheDocument()
    })

    it('should show recent threats', () => {
      render(<App />)
      
      expect(screen.getByText('Recent Threats')).toBeInTheDocument()
      expect(screen.getByText('Malware C2 Communication')).toBeInTheDocument()
      expect(screen.getByText('DDoS Attack Pattern')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true })
      
      render(<App />)
      
      expect(screen.getByText('SNN/ANN Edge Security')).toBeInTheDocument()
      
      // Test tablet size
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true })
      
      render(<App />)
      
      expect(screen.getAllByText('SNN/ANN Edge Security')).toHaveLength(2) // Both renders
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<App />)
      
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      
      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(3)
    })

    it('should support keyboard navigation', () => {
      render(<App />)
      
      const pauseButton = screen.getByText('Pause')
      pauseButton.focus()
      expect(document.activeElement).toBe(pauseButton)
    })
  })
})

describe('Performance Tests', () => {
  it('should render within acceptable time', () => {
    const startTime = performance.now()
    render(<App />)
    const endTime = performance.now()
    
    const renderTime = endTime - startTime
    expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
  })

  it('should handle multiple re-renders efficiently', () => {
    const { rerender } = render(<App />)
    
    const startTime = performance.now()
    for (let i = 0; i < 10; i++) {
      rerender(<App />)
    }
    const endTime = performance.now()
    
    const totalTime = endTime - startTime
    expect(totalTime).toBeLessThan(500) // 10 re-renders in less than 500ms
  })
})
