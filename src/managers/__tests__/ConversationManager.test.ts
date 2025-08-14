import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConversationManager } from '@/managers/ConversationManager'
import { ConversationService } from '@/services/conversationService'

// Mock dependencies
vi.mock('@/services/conversationService')
vi.mock('@/utils/guestId', () => ({
  getOrCreateGuestId: () => 'test-guest-id-12345'
}))

const mockConversationService = ConversationService as vi.Mocked<typeof ConversationService>

describe('ConversationManager', () => {
  let manager: ConversationManager

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance for testing
    ;(ConversationManager as any).instance = null
    manager = ConversationManager.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConversationManager.getInstance()
      const instance2 = ConversationManager.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(manager)
    })
  })

  describe('Conversation Lifecycle', () => {
    it('should start new conversation correctly', () => {
      const queryData = {
        conversation_id: 'conv-123',
        query: '水稻病害如何防治',
        inputs: { type: 'pesticide' },
        user: 'user-456'
      }

      const conversation = manager.startConversation(queryData)

      expect(conversation).toMatchObject({
        conversationId: 'conv-123',
        guestId: 'test-guest-id-12345',
        userQuery: '水稻病害如何防治',
        userInputs: { type: 'pesticide' },
        user: 'user-456',
        streamMessages: [],
        finalAnswer: null,
        usageStats: null,
        workflowData: null
      })
      expect(conversation.startTime).toBeTypeOf('number')
    })

    it('should continue existing conversation', () => {
      const queryData = {
        conversation_id: 'existing-conv',
        query: '原始问题',
        user: 'user-123'
      }

      // Start initial conversation
      const firstCall = manager.startConversation(queryData)
      
      // Try to start again with same ID
      const secondCall = manager.startConversation(queryData)

      expect(firstCall).toBe(secondCall) // Should return same object
      expect(secondCall.userQuery).toBe('原始问题') // Should keep original query
    })

    it('should handle conversation without inputs', () => {
      const queryData = {
        conversation_id: 'conv-no-inputs',
        query: '简单问题',
        user: 'user-789'
      }

      const conversation = manager.startConversation(queryData)

      expect(conversation.userInputs).toEqual({})
    })
  })

  describe('Stream Event Processing', () => {
    beforeEach(() => {
      manager.startConversation({
        conversation_id: 'test-conv',
        query: 'test query',
        user: 'test-user'
      })
    })

    it('should handle workflow_started event', () => {
      const event = {
        event: 'workflow_started' as const,
        conversation_id: 'dify-conv-456',
        message_id: 'msg-123',
        created_at: Date.now(),
        task_id: 'task-123',
        workflow_run_id: 'run-123',
        data: {
          id: 'workflow-id',
          workflow_id: 'wf-123',
          inputs: {},
          created_at: Date.now()
        }
      }

      manager.onStreamMessage('test-conv', event)

      const conversation = manager.getConversation('test-conv')
      expect(conversation?.difyConversationId).toBe('dify-conv-456')
      expect(conversation?.streamMessages).toHaveLength(1)
      expect(conversation?.streamMessages[0].event).toBe('workflow_started')
    })

    it('should handle message events and accumulate answer', () => {
      const messageEvent1 = {
        event: 'message' as const,
        task_id: 'task-123',
        id: 'msg-id',
        message_id: 'msg-123',
        conversation_id: 'dify-conv-456',
        mode: 'streaming',
        answer: '这是第一段',
        created_at: Date.now()
      }

      const messageEvent2 = {
        event: 'message' as const,
        task_id: 'task-123',
        id: 'msg-id-2',
        message_id: 'msg-123',
        conversation_id: 'dify-conv-456',
        mode: 'streaming',
        answer: '这是第二段',
        created_at: Date.now()
      }

      manager.onStreamMessage('test-conv', messageEvent1)
      manager.onStreamMessage('test-conv', messageEvent2)

      const conversation = manager.getConversation('test-conv')
      expect(conversation?.finalAnswer).toBe('这是第一段这是第二段')
      expect(conversation?.streamMessages).toHaveLength(2)
    })

    it('should handle workflow_finished event with output transformation', () => {
      const workflowFinishedEvent = {
        event: 'workflow_finished' as const,
        conversation_id: 'dify-conv-456',
        message_id: 'msg-123',
        created_at: Date.now(),
        task_id: 'task-123',
        workflow_run_id: 'run-123',
        data: {
          id: 'workflow-id',
          workflow_id: 'wf-123',
          status: 'completed',
          outputs: { answer: '完整答案' },
          elapsed_time: 5000,
          total_tokens: 150,
          total_steps: 3,
          exceptions_count: 0,
          created_by: { id: 'user-id', user: 'test-user' },
          created_at: Date.now(),
          finished_at: Date.now()
        }
      }

      manager.onStreamMessage('test-conv', workflowFinishedEvent)

      const conversation = manager.getConversation('test-conv')
      expect(conversation?.finalAnswer).toBe('完整答案')
      expect(conversation?.workflowData).toMatchObject({
        id: 'workflow-id',
        workflowId: 'wf-123',
        status: 'completed',
        elapsedTime: 5000,
        totalTokens: 150,
        totalSteps: 3,
        exceptionsCount: 0,
        createdBy: { id: 'user-id', user: 'test-user' }
      })
      // Should not have underscore fields
      expect(conversation?.workflowData).not.toHaveProperty('workflow_id')
      expect(conversation?.workflowData).not.toHaveProperty('elapsed_time')
    })

    it('should handle message_end event with usage stats transformation', () => {
      const messageEndEvent = {
        event: 'message_end' as const,
        conversation_id: 'dify-conv-456',
        message_id: 'msg-123',
        created_at: Date.now(),
        task_id: 'task-123',
        id: 'end-id',
        metadata: {
          usage: {
            prompt_tokens: 50,
            prompt_unit_price: '0.001',
            prompt_price_unit: 'USD',
            prompt_price: '0.05',
            completion_tokens: 100,
            completion_unit_price: '0.002',
            completion_price_unit: 'USD',
            completion_price: '0.20',
            total_tokens: 150,
            total_price: '0.25',
            currency: 'USD',
            latency: 2500
          }
        }
      }

      manager.onStreamMessage('test-conv', messageEndEvent)

      const conversation = manager.getConversation('test-conv')
      expect(conversation?.usageStats).toMatchObject({
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150,
        totalPrice: '0.25',
        currency: 'USD',
        latency: 2500
      })
    })

    it('should handle unknown conversation ID gracefully', () => {
      const event = {
        event: 'message' as const,
        task_id: 'task-123',
        id: 'msg-id',
        message_id: 'msg-123',
        conversation_id: 'dify-conv-456',
        mode: 'streaming',
        answer: 'test answer',
        created_at: Date.now()
      }

      // Should not throw
      expect(() => {
        manager.onStreamMessage('non-existent-conv', event)
      }).not.toThrow()
    })
  })

  describe('Conversation Persistence', () => {
    beforeEach(() => {
      manager.startConversation({
        conversation_id: 'persist-test',
        query: '测试保存',
        user: 'test-user'
      })
    })

    it('should finish conversation and save to backend successfully', async () => {
      mockConversationService.storeConversation.mockResolvedValueOnce({
        success: true,
        data: { id: 'saved-123' },
        message: 'Conversation stored successfully'
      })

      // Add some data to conversation
      manager.onStreamMessage('persist-test', {
        event: 'message',
        task_id: 'task-123',
        id: 'msg-id',
        message_id: 'msg-123',
        conversation_id: 'dify-conv-real',
        mode: 'streaming',
        answer: '测试答案',
        created_at: Date.now()
      })

      const result = await manager.finishConversation('persist-test')

      expect(result).toBe(true)
      expect(mockConversationService.storeConversation).toHaveBeenCalledWith({
        conversationId: 'dify-conv-real', // Should use Dify ID when available
        guestId: 'test-guest-id-12345',
        userQuery: '测试保存',
        userInputs: {},
        user: 'test-user',
        finalAnswer: '测试答案',
        usageStats: null,
        workflowData: null,
        streamMessages: expect.arrayContaining([
          expect.objectContaining({
            event: 'message',
            timestamp: expect.any(Number)
          })
        ]),
        duration: expect.any(Number)
      })

      // Conversation should be cleaned up
      expect(manager.getConversation('persist-test')).toBeNull()
    })

    it('should handle backend save failure', async () => {
      mockConversationService.storeConversation.mockResolvedValueOnce({
        success: false,
        message: 'Save failed',
        data: null
      })

      const result = await manager.finishConversation('persist-test')

      expect(result).toBe(false)
      // Should still clean up conversation
      expect(manager.getConversation('persist-test')).toBeNull()
    })

    it('should handle save exceptions', async () => {
      mockConversationService.storeConversation.mockRejectedValueOnce(new Error('Network error'))

      const result = await manager.finishConversation('persist-test')

      expect(result).toBe(false)
      // Should still clean up conversation
      expect(manager.getConversation('persist-test')).toBeNull()
    })

    it('should calculate duration correctly', async () => {
      vi.useFakeTimers()
      
      mockConversationService.storeConversation.mockResolvedValueOnce({
        success: true,
        data: { id: 'saved-123' },
        message: 'Success'
      })

      const startTime = Date.now()
      // Simulate time passing
      vi.advanceTimersByTime(5000)

      await manager.finishConversation('persist-test')

      const storeCall = mockConversationService.storeConversation.mock.calls[0][0]
      expect(storeCall.duration).toBeGreaterThanOrEqual(5000)
      
      vi.useRealTimers()
    })

    it('should use fallback conversation ID when Dify ID not available', async () => {
      mockConversationService.storeConversation.mockResolvedValueOnce({
        success: true,
        data: { id: 'saved-123' },
        message: 'Success'
      })

      await manager.finishConversation('persist-test')

      const storeCall = mockConversationService.storeConversation.mock.calls[0][0]
      expect(storeCall.conversationId).toBe('persist-test')
    })
  })

  describe('Conversation Management', () => {
    it('should provide access to conversation data', () => {
      manager.startConversation({
        conversation_id: 'access-test',
        query: 'test access',
        user: 'user-123'
      })

      const conversation = manager.getConversation('access-test')
      expect(conversation).not.toBeNull()
      expect(conversation?.userQuery).toBe('test access')

      const nonExistent = manager.getConversation('does-not-exist')
      expect(nonExistent).toBeNull()
    })

    it('should list all active conversations', () => {
      manager.startConversation({
        conversation_id: 'conv-1',
        query: 'query 1',
        user: 'user-1'
      })

      manager.startConversation({
        conversation_id: 'conv-2',
        query: 'query 2',
        user: 'user-2'
      })

      const active = manager.getActiveConversations()
      expect(active).toHaveLength(2)
      expect(active.map(c => c.conversationId)).toContain('conv-1')
      expect(active.map(c => c.conversationId)).toContain('conv-2')
    })

    it('should clear specific conversation', () => {
      manager.startConversation({
        conversation_id: 'clear-test',
        query: 'test clear',
        user: 'user-123'
      })

      expect(manager.getConversation('clear-test')).not.toBeNull()

      manager.clearConversation('clear-test')

      expect(manager.getConversation('clear-test')).toBeNull()
    })

    it('should clear all conversations', () => {
      manager.startConversation({
        conversation_id: 'conv-1',
        query: 'query 1',
        user: 'user-1'
      })

      manager.startConversation({
        conversation_id: 'conv-2',
        query: 'query 2',
        user: 'user-2'
      })

      expect(manager.getActiveConversations()).toHaveLength(2)

      manager.clearAllConversations()

      expect(manager.getActiveConversations()).toHaveLength(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle finish conversation for non-existent ID', async () => {
      const result = await manager.finishConversation('non-existent')
      expect(result).toBe(false)
      expect(mockConversationService.storeConversation).not.toHaveBeenCalled()
    })

    it('should handle malformed event data', () => {
      manager.startConversation({
        conversation_id: 'malformed-test',
        query: 'test',
        user: 'user-123'
      })

      // Should not throw with malformed event
      expect(() => {
        manager.onStreamMessage('malformed-test', {
          event: 'unknown_event',
          // Missing required fields
        } as any)
      }).not.toThrow()

      const conversation = manager.getConversation('malformed-test')
      expect(conversation?.streamMessages).toHaveLength(1)
    })

    it('should handle node_started and node_finished events', () => {
      manager.startConversation({
        conversation_id: 'node-test',
        query: 'test nodes',
        user: 'user-123'
      })

      const nodeStartedEvent = {
        event: 'node_started' as const,
        conversation_id: 'dify-conv',
        message_id: 'msg-123',
        created_at: Date.now(),
        task_id: 'task-123',
        workflow_run_id: 'run-123',
        data: {
          id: 'node-1',
          node_id: 'analysis-node',
          node_type: 'analysis',
          title: '问题分析节点',
          index: 1,
          created_at: Date.now()
        }
      }

      const nodeFinishedEvent = {
        event: 'node_finished' as const,
        conversation_id: 'dify-conv',
        message_id: 'msg-123',
        created_at: Date.now(),
        task_id: 'task-123',
        workflow_run_id: 'run-123',
        data: {
          id: 'node-1',
          node_id: 'analysis-node',
          node_type: 'analysis',
          title: '问题分析节点',
          index: 1,
          status: 'completed',
          created_at: Date.now(),
          finished_at: Date.now()
        }
      }

      manager.onStreamMessage('node-test', nodeStartedEvent)
      manager.onStreamMessage('node-test', nodeFinishedEvent)

      const conversation = manager.getConversation('node-test')
      expect(conversation?.streamMessages).toHaveLength(2)
      expect(conversation?.streamMessages[0].event).toBe('node_started')
      expect(conversation?.streamMessages[1].event).toBe('node_finished')
    })
  })
})