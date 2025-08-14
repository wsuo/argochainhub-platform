import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AISearchService } from '@/services/aiSearchService'
import { conversationManager } from '@/managers/ConversationManager'
import { ConversationService } from '@/services/conversationService'

// Mock environment variables for integration testing
vi.stubEnv('VITE_DIFY_API_BASE_URL', 'http://test-api.com/v1')
vi.stubEnv('VITE_DIFY_APP_ID', 'test-app-id')
vi.stubEnv('VITE_DIFY_API_KEY', 'test-api-key')

// Mock external services
vi.mock('@/services/conversationService')
const mockConversationService = ConversationService as vi.Mocked<typeof ConversationService>

describe('AI Search Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    AISearchService.resetConversation()
    conversationManager.clearAllConversations()
    
    // Mock successful conversation storage
    mockConversationService.storeConversation.mockResolvedValue({
      success: true,
      data: { id: 'stored-conversation-123' },
      message: 'Conversation stored successfully'
    })
  })

  describe('AI Service to Conversation Manager Integration', () => {
    it('should integrate AI streaming with conversation management', async () => {
      // Mock fetch for streaming response
      const mockStreamData = [
        'data: {"event":"workflow_started","conversation_id":"dify-conv-123","message_id":"msg-123","data":{"id":"workflow-1"}}\n',
        'data: {"event":"node_started","conversation_id":"dify-conv-123","message_id":"msg-123","data":{"title":"问题分析","node_type":"analysis","index":1}}\n',
        'data: {"event":"message","conversation_id":"dify-conv-123","message_id":"msg-123","answer":"这是农药使用建议"}\n',
        'data: {"event":"workflow_finished","conversation_id":"dify-conv-123","message_id":"msg-123","data":{"id":"workflow-1","status":"completed","outputs":{"answer":"完整答案"}}}\n',
        'data: {"event":"message_end","conversation_id":"dify-conv-123","message_id":"msg-123","metadata":{"usage":{"total_tokens":150,"total_price":"0.25"}}}\n',
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

      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

      // Start conversation in manager
      const conversation = conversationManager.startConversation({
        conversation_id: 'local-conv-456',
        query: '水稻病害防治方案',
        inputs: { crop_type: 'rice' },
        user: 'test-user-789'
      })

      // Track stream events
      const streamEvents: any[] = []

      // Send message through AI service
      await AISearchService.sendMessage(
        '水稻病害防治方案',
        (chunk) => {
          // Pass chunk to conversation manager
          if (chunk.event === 'message') {
            conversationManager.onStreamMessage('local-conv-456', chunk as any)
          }
        },
        (error) => {
          throw error
        },
        async () => {
          // Conversation should be completed and stored
          const result = await conversationManager.finishConversation('local-conv-456')
          expect(result).toBe(true)
        },
        (event) => {
          streamEvents.push(event)
          conversationManager.onStreamMessage('local-conv-456', event)
        }
      )

      // Verify conversation state
      expect(streamEvents).toHaveLength(5) // workflow_started, node_started, message, workflow_finished, message_end
      expect(streamEvents[0].event).toBe('workflow_started')
      expect(streamEvents[1].event).toBe('node_started')
      expect(streamEvents[2].event).toBe('message')
      expect(streamEvents[3].event).toBe('workflow_finished')
      expect(streamEvents[4].event).toBe('message_end')

      // Verify conversation was stored
      expect(mockConversationService.storeConversation).toHaveBeenCalledWith({
        conversationId: 'dify-conv-123', // Should use Dify conversation ID
        guestId: expect.any(String),
        userQuery: '水稻病害防治方案',
        userInputs: { crop_type: 'rice' },
        user: 'test-user-789',
        finalAnswer: '完整答案', // From workflow_finished event
        usageStats: {
          totalTokens: 150,
          totalPrice: '0.25',
          promptTokens: undefined,
          completionTokens: undefined,
          currency: undefined,
          latency: undefined
        },
        workflowData: expect.objectContaining({
          id: 'workflow-1',
          status: 'completed'
        }),
        streamMessages: expect.arrayContaining([
          expect.objectContaining({
            event: 'workflow_started',
            timestamp: expect.any(Number)
          }),
          expect.objectContaining({
            event: 'message_end',
            timestamp: expect.any(Number)
          })
        ]),
        duration: expect.any(Number)
      })
    })

    it('should handle AI service errors in conversation flow', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network timeout'))

      const conversation = conversationManager.startConversation({
        conversation_id: 'error-test-conv',
        query: 'Error test query',
        user: 'test-user'
      })

      let caughtError: Error | null = null

      await AISearchService.sendMessage(
        'Error test query',
        vi.fn(),
        (error) => {
          caughtError = error
          // Clean up conversation on error
          conversationManager.clearConversation('error-test-conv')
        },
        vi.fn(),
        vi.fn()
      )

      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toBe('Network timeout')
      expect(conversationManager.getConversation('error-test-conv')).toBeNull()
    })

    it('should handle conversation persistence failures gracefully', async () => {
      // Mock conversation service failure
      mockConversationService.storeConversation.mockRejectedValueOnce(new Error('Database connection failed'))

      const mockStreamData = 'data: {"event":"message","answer":"test answer"}\ndata: [DONE]\n'

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

      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

      conversationManager.startConversation({
        conversation_id: 'persistence-fail-test',
        query: 'Test query',
        user: 'test-user'
      })

      await AISearchService.sendMessage(
        'Test query',
        (chunk) => {
          conversationManager.onStreamMessage('persistence-fail-test', chunk as any)
        },
        vi.fn(),
        async () => {
          const result = await conversationManager.finishConversation('persistence-fail-test')
          expect(result).toBe(false) // Should return false on save failure
        },
        (event) => {
          conversationManager.onStreamMessage('persistence-fail-test', event)
        }
      )

      // Conversation should still be cleaned up even if save fails
      expect(conversationManager.getConversation('persistence-fail-test')).toBeNull()
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent conversations', async () => {
      const conversations = ['conv-1', 'conv-2', 'conv-3']
      const promises: Promise<void>[] = []

      conversations.forEach((convId, index) => {
        const mockStreamData = `data: {"event":"message","conversation_id":"dify-${convId}","answer":"答案 ${index + 1}"}\ndata: [DONE]\n`

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

        global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

        conversationManager.startConversation({
          conversation_id: convId,
          query: `查询 ${index + 1}`,
          user: 'concurrent-test-user'
        })

        const promise = AISearchService.sendMessage(
          `查询 ${index + 1}`,
          (chunk) => {
            conversationManager.onStreamMessage(convId, chunk as any)
          },
          vi.fn(),
          async () => {
            await conversationManager.finishConversation(convId)
          }
        )

        promises.push(promise)
      })

      await Promise.all(promises)

      // All conversations should be completed and cleaned up
      conversations.forEach(convId => {
        expect(conversationManager.getConversation(convId)).toBeNull()
      })

      expect(mockConversationService.storeConversation).toHaveBeenCalledTimes(3)
    })

    it('should maintain conversation isolation', async () => {
      const conv1Data = 'data: {"event":"message","conversation_id":"dify-conv-1","answer":"答案1"}\ndata: [DONE]\n'
      const conv2Data = 'data: {"event":"message","conversation_id":"dify-conv-2","answer":"答案2"}\ndata: [DONE]\n'

      // Mock different responses for different conversations
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => ({
              read: vi.fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(conv1Data)
                })
                .mockResolvedValueOnce({
                  done: true,
                  value: undefined
                }),
              releaseLock: vi.fn(),
            }),
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => ({
              read: vi.fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(conv2Data)
                })
                .mockResolvedValueOnce({
                  done: true,
                  value: undefined
                }),
              releaseLock: vi.fn(),
            }),
          },
        })

      conversationManager.startConversation({
        conversation_id: 'isolation-test-1',
        query: '问题1',
        user: 'user1'
      })

      conversationManager.startConversation({
        conversation_id: 'isolation-test-2',
        query: '问题2',
        user: 'user2'
      })

      const promise1 = AISearchService.sendMessage(
        '问题1',
        (chunk) => conversationManager.onStreamMessage('isolation-test-1', chunk as any)
      )

      const promise2 = AISearchService.sendMessage(
        '问题2',
        (chunk) => conversationManager.onStreamMessage('isolation-test-2', chunk as any)
      )

      await Promise.all([promise1, promise2])

      // Each conversation should have received its own answer
      const conv1 = conversationManager.getConversation('isolation-test-1')
      const conv2 = conversationManager.getConversation('isolation-test-2')

      expect(conv1?.finalAnswer).toBe('答案1')
      expect(conv1?.difyConversationId).toBe('dify-conv-1')
      
      expect(conv2?.finalAnswer).toBe('答案2')
      expect(conv2?.difyConversationId).toBe('dify-conv-2')
    })
  })

  describe('Performance Integration Tests', () => {
    it('should handle large responses efficiently', async () => {
      const largeAnswer = '农药使用指导：'.repeat(10000) // Very large response

      const mockStreamData = `data: {"event":"message","answer":"${largeAnswer}"}\ndata: [DONE]\n`

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

      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

      conversationManager.startConversation({
        conversation_id: 'large-response-test',
        query: 'Request large response',
        user: 'performance-test-user'
      })

      const startTime = performance.now()

      await AISearchService.sendMessage(
        'Request large response',
        (chunk) => {
          conversationManager.onStreamMessage('large-response-test', chunk as any)
        },
        vi.fn(),
        async () => {
          const endTime = performance.now()
          const duration = endTime - startTime

          // Should complete within reasonable time (< 1 second for mock)
          expect(duration).toBeLessThan(1000)

          await conversationManager.finishConversation('large-response-test')
        }
      )

      // Verify large response was handled correctly
      expect(mockConversationService.storeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          finalAnswer: largeAnswer
        })
      )
    })

    it('should handle rapid stream events without data loss', async () => {
      // Generate many small message chunks
      const chunks = Array.from({ length: 100 }, (_, i) => `块${i} `)
      const streamData = chunks
        .map(chunk => `data: {"event":"message","answer":"${chunk}"}`)
        .join('\n') + '\ndata: [DONE]\n'

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(streamData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn(),
          }),
        },
      }

      global.fetch = vi.fn().mockResolvedValueOnce(mockResponse)

      conversationManager.startConversation({
        conversation_id: 'rapid-stream-test',
        query: 'Rapid stream test',
        user: 'stream-test-user'
      })

      let chunkCount = 0

      await AISearchService.sendMessage(
        'Rapid stream test',
        (chunk) => {
          chunkCount++
          conversationManager.onStreamMessage('rapid-stream-test', chunk as any)
        },
        vi.fn(),
        async () => {
          await conversationManager.finishConversation('rapid-stream-test')
        }
      )

      // Should have received all chunks
      expect(chunkCount).toBe(100)

      const finalAnswer = chunks.join('')
      expect(mockConversationService.storeConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          finalAnswer
        })
      )
    })
  })
})