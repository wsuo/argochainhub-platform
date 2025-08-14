import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '../test/utils'
import { useTypewriterEffect } from '@/hooks/useTypewriterEffect'

// Mock timers
vi.useFakeTimers()

describe('useTypewriterEffect Hook', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Basic Functionality', () => {
    it('should display text progressively', async () => {
      const { result } = renderHook(() =>
        useTypewriterEffect('Hello World', { speed: 10 })
      )

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(true)

      // Advance timers to trigger typewriter effect
      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.displayedText.length).toBeGreaterThan(0)
      expect(result.current.isTyping).toBe(true)

      // Complete the typing
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.displayedText).toBe('Hello World')
      expect(result.current.isTyping).toBe(false)
    })

    it('should handle empty text', () => {
      const { result } = renderHook(() =>
        useTypewriterEffect('', { speed: 10 })
      )

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)
    })

    it('should call onComplete when typing finishes', () => {
      const onComplete = vi.fn()
      
      renderHook(() =>
        useTypewriterEffect('Test', { speed: 10, onComplete })
      )

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(onComplete).toHaveBeenCalledOnce()
    })
  })

  describe('Text Updates', () => {
    it('should handle text updates correctly', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text, { speed: 10 }),
        { initialProps: { text: 'First text' } }
      )

      // Initial text starts typing
      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(50)
      })

      const firstProgress = result.current.displayedText

      // Update with longer text (continuation)
      rerender({ text: 'First text and more content' })

      expect(result.current.isTyping).toBe(true)
      expect(result.current.displayedText).toBe(firstProgress)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.displayedText.length).toBeGreaterThan(firstProgress.length)
    })

    it('should restart when text is completely different', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text, { speed: 10 }),
        { initialProps: { text: 'First message' } }
      )

      act(() => {
        vi.advanceTimersByTime(50)
      })

      const firstProgress = result.current.displayedText
      expect(firstProgress.length).toBeGreaterThan(0)

      // Completely different text
      rerender({ text: 'Totally different message' })

      // Should restart from beginning
      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.displayedText).toMatch(/^Totally/)
    })

    it('should handle shorter text (new message)', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text, { speed: 10 }),
        { initialProps: { text: 'Long initial message' } }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should have some progress
      expect(result.current.displayedText.length).toBeGreaterThan(0)

      // Shorter text (new message)
      rerender({ text: 'Short' })

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.displayedText).toBe('Short')
    })
  })

  describe('Performance and Optimization', () => {
    it('should use appropriate chunk size for long text', () => {
      const longText = 'This is a very long text that should be chunked appropriately for better performance and user experience. '.repeat(10)

      const { result } = renderHook(() =>
        useTypewriterEffect(longText, { speed: 5, chunkSize: 10 })
      )

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(20)
      })

      const firstUpdate = result.current.displayedText
      expect(firstUpdate.length).toBeGreaterThan(5) // Should chunk multiple characters
    })

    it('should handle rapid text updates without issues', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text, { speed: 10 }),
        { initialProps: { text: 'Initial' } }
      )

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        rerender({ text: `Initial ${'text '.repeat(i)}` })
      }

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.displayedText).toContain('Initial')
    })

    it('should clean up intervals on unmount', () => {
      const { unmount } = renderHook(() =>
        useTypewriterEffect('Test text', { speed: 10 })
      )

      act(() => {
        vi.advanceTimersByTime(50)
      })

      unmount()

      // Should not throw or cause memory leaks
      act(() => {
        vi.advanceTimersByTime(1000)
      })
    })
  })

  describe('Smart Chunking', () => {
    it('should handle markdown content appropriately', () => {
      const markdownText = '## 标题\n\n这是一个段落。\n\n- 列表项1\n- 列表项2\n\n**粗体文本**和`代码`。'

      const { result } = renderHook(() =>
        useTypewriterEffect(markdownText, { speed: 10, chunkSize: 10 })
      )

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should show progressive content
      expect(result.current.displayedText.length).toBeGreaterThan(0)
    })

    it('should handle very short text character by character', () => {
      const shortText = 'Hi!'

      const { result } = renderHook(() =>
        useTypewriterEffect(shortText, { speed: 10 })
      )

      act(() => {
        vi.advanceTimersByTime(15)
      })

      expect(result.current.displayedText).toBe('H')

      act(() => {
        vi.advanceTimersByTime(10)
      })

      expect(result.current.displayedText).toBe('Hi')

      act(() => {
        vi.advanceTimersByTime(10)
      })

      expect(result.current.displayedText).toBe('Hi!')
      expect(result.current.isTyping).toBe(false)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset state when reset is called', () => {
      const { result } = renderHook(() =>
        useTypewriterEffect('Test text', { speed: 10 })
      )

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.displayedText.length).toBeGreaterThan(0)
      expect(result.current.isTyping).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)
    })

    it('should stop typing animation when reset', () => {
      const onComplete = vi.fn()
      
      const { result } = renderHook(() =>
        useTypewriterEffect('Test text', { speed: 10, onComplete })
      )

      act(() => {
        vi.advanceTimersByTime(30)
      })

      act(() => {
        result.current.reset()
      })

      // Continue advancing time
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // onComplete should not be called after reset
      expect(onComplete).not.toHaveBeenCalled()
      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null/undefined text', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text as string, { speed: 10 }),
        { initialProps: { text: null } }
      )

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)

      rerender({ text: undefined })

      expect(result.current.displayedText).toBe('')
      expect(result.current.isTyping).toBe(false)
    })

    it('should handle special characters', () => {
      const specialText = '测试中文，emoji 🌾🌽，符号：【】《》！@#$%^&*()'

      const { result } = renderHook(() =>
        useTypewriterEffect(specialText, { speed: 10 })
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.displayedText).toContain('测试')
      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.displayedText).toBe(specialText)
    })

    it('should handle very fast speed', () => {
      const { result } = renderHook(() =>
        useTypewriterEffect('Fast typing test', { speed: 1 })
      )

      act(() => {
        vi.advanceTimersByTime(20)
      })

      expect(result.current.displayedText.length).toBeGreaterThan(5)
      expect(result.current.isTyping).toBe(true)
    })

    it('should handle very slow speed', () => {
      const { result } = renderHook(() =>
        useTypewriterEffect('Slow typing test', { speed: 1000 })
      )

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should not have progressed much
      expect(result.current.displayedText.length).toBeLessThan(5)
      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(result.current.displayedText.length).toBeGreaterThan(3)
    })
  })

  describe('Real-world Simulation', () => {
    it('should simulate AI streaming response', () => {
      let currentText = ''
      const streamingResponses = [
        '农药',
        '农药使用',
        '农药使用指南',
        '农药使用指南：\n\n',
        '农药使用指南：\n\n1. 选择合适',
        '农药使用指南：\n\n1. 选择合适的农药\n2. 注意',
        '农药使用指南：\n\n1. 选择合适的农药\n2. 注意使用浓度\n3. 防护措施要到位'
      ]

      const { result, rerender } = renderHook(
        ({ text }) => useTypewriterEffect(text, { speed: 20 }),
        { initialProps: { text: streamingResponses[0] } }
      )

      // Simulate streaming
      streamingResponses.forEach((response, index) => {
        if (index > 0) {
          act(() => {
            vi.advanceTimersByTime(50)
          })
          rerender({ text: response })
        }
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current.displayedText).toContain('农药使用指南')
      expect(result.current.displayedText).toContain('防护措施')
    })
  })
})

// Test throttle utility function
describe('throttle utility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle function calls', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('call1')
    throttledFn('call2')
    throttledFn('call3')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('call1')

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith('call3')
  })

  it('should allow immediate calls after delay', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('immediate1')
    expect(mockFn).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(150)
    })

    throttledFn('immediate2')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith('immediate2')
  })
})