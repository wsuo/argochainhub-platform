import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AISearchService, DifyStreamEvent, WorkflowStatus } from '@/services/aiSearchService'

// Mock environment variables
vi.mock('meta.env', () => ({
  VITE_DIFY_API_BASE_URL: 'http://test-api.com/v1',
  VITE_DIFY_APP_ID: 'test-app-id',
  VITE_DIFY_API_KEY: 'test-api-key',
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AISearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    AISearchService.resetConversation()
  })

  describe('sendMessage - Streaming Integration', () => {
    it('should handle streaming response correctly', async () => {
      const mockStreamData = [
        'data: {"event":"workflow_started","conversation_id":"conv-123","data":{"id":"workflow-1"}}\n',
        'data: {"event":"message","answer":"测试","conversation_id":"conv-123"}\n',
        'data: {"event":"message","answer":"回答","conversation_id":"conv-123"}\n',
        'data: [DONE]\n'
      ].join('')

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn(),
          }),
        },
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const onChunk = vi.fn()
      const onError = vi.fn()
      const onComplete = vi.fn()
      const onWorkflowEvent = vi.fn()

      await AISearchService.sendMessage(
        'test query',
        onChunk,
        onError,
        onComplete,
        onWorkflowEvent
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/v1/chat-messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer app-pHmzn3L1TMOrRWvoIa8mr6w0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {},
            query: 'test query',
            response_mode: 'streaming',
            user: expect.any(String),
          }),
        })
      )

      expect(onWorkflowEvent).toHaveBeenCalledWith({
        event: 'workflow_started',
        conversation_id: 'conv-123',
        data: { id: 'workflow-1' }
      })

      expect(onChunk).toHaveBeenCalledTimes(2)
      expect(onComplete).toHaveBeenCalledOnce()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const onChunk = vi.fn()
      const onError = vi.fn()
      const onComplete = vi.fn()
      const onWorkflowEvent = vi.fn()

      await AISearchService.sendMessage(
        'test query',
        onChunk,
        onError,
        onComplete,
        onWorkflowEvent
      )

      expect(onError).toHaveBeenCalledWith(new Error('Network error'))
      expect(onChunk).not.toHaveBeenCalled()
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const onError = vi.fn()

      await AISearchService.sendMessage('test query', vi.fn(), onError)

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'HTTP error! status: 500'
        })
      )
    })

    it('should handle malformed streaming data', async () => {
      const mockStreamData = 'data: invalid json\n'

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn(),
          }),
        },
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const onChunk = vi.fn()
      const onError = vi.fn()
      const onComplete = vi.fn()
      const onWorkflowEvent = vi.fn()

      // Should not throw, but handle gracefully
      await expect(
        AISearchService.sendMessage(
          'test query',
          onChunk,
          onError,
          onComplete,
          onWorkflowEvent
        )
      ).resolves.toBeUndefined()

      expect(onComplete).toHaveBeenCalledOnce()
    })
  })

  describe('conversation management', () => {
    it('should track conversation ID from stream events', async () => {
      const mockStreamData = 'data: {"event":"message","conversation_id":"conv-456","answer":"test"}\n'

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(mockStreamData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn(),
          }),
        },
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      expect(AISearchService.getConversationId()).toBeNull()

      await AISearchService.sendMessage('test', vi.fn())

      expect(AISearchService.getConversationId()).toBe('conv-456')
    })

    it('should use existing conversation ID in subsequent calls', async () => {
      AISearchService.setConversationId('existing-conv-123')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        },
      })

      await AISearchService.sendMessage('test', vi.fn())

      const lastCall = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(lastCall[1].body)
      
      expect(requestBody.conversation_id).toBe('existing-conv-123')
    })
  })

  describe('blocking mode', () => {
    it('should handle blocking mode requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          event: 'message',
          answer: 'Complete response',
          conversation_id: 'conv-789',
        }),
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const result = await AISearchService.sendMessageBlocking('test query')

      expect(result.answer).toBe('Complete response')
      expect(AISearchService.getConversationId()).toBe('conv-789')
    })
  })

  describe('user management', () => {
    it('should generate and maintain user ID', () => {
      const userId1 = AISearchService.getUserId()
      const userId2 = AISearchService.getUserId()

      expect(userId1).toMatch(/^user-[a-z0-9]+$/)
      expect(userId1).toBe(userId2) // Should be consistent

      AISearchService.setUserId('custom-user-123')
      expect(AISearchService.getUserId()).toBe('custom-user-123')
    })

    it('should reset conversation state correctly', () => {
      AISearchService.setConversationId('conv-test')
      const originalUserId = AISearchService.getUserId()

      AISearchService.resetConversation()

      expect(AISearchService.getConversationId()).toBeNull()
      expect(AISearchService.getUserId()).not.toBe(originalUserId)
    })
  })
})