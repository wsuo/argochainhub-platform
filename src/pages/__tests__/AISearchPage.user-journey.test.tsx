import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import AISearchPage from '@/pages/AISearchPage'
import { AISearchService } from '@/services/aiSearchService'
import { conversationManager } from '@/managers/ConversationManager'

// Mock all dependencies for user journey testing
vi.mock('@/services/aiSearchService')
vi.mock('@/managers/ConversationManager')
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))

const mockAISearchService = AISearchService as vi.Mocked<typeof AISearchService>
const mockConversationManager = conversationManager as vi.Mocked<typeof conversationManager>

describe('AISearchPage User Journey Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAISearchService.getUserId.mockReturnValue('test-user-id')
    mockConversationManager.startConversation.mockReturnValue({
      conversationId: 'test-conv-id',
      guestId: 'test-guest-id',
      userQuery: 'test query',
      userInputs: {},
      user: 'test-user-id',
      startTime: Date.now(),
      streamMessages: [],
      finalAnswer: null,
      usageStats: null,
      workflowData: null,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Complete User Journey - First Time User', () => {
    it('should guide user through complete pesticide consultation journey', async () => {
      // Mock successful AI responses
      let responseCount = 0
      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        responseCount++
        
        setTimeout(() => {
          let response = ''
          if (query.includes('水稻病害')) {
            response = '## 水稻稻瘟病防治\n\n推荐使用75%三环唑可湿性粉剂800-1000倍液。\n\n## 使用方法\n\n叶面喷雾，间隔7-10天施药一次。'
          } else if (query.includes('用药量')) {
            response = '## 具体用药量建议\n\n每亩用药液50-75公斤，三环唑用量15-20克/亩。\n\n## 注意事项\n\n避免重复用药，注意轮换使用。'
          } else {
            response = '## 农药咨询建议\n\n根据您的问题，建议咨询当地农技站获得更准确的指导。'
          }

          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: response,
            created_at: Date.now(),
          })
          
          setTimeout(() => {
            onComplete?.()
          }, 100)
        }, 300)
      })

      render(<AISearchPage />)

      // Step 1: User arrives at page and sees welcome content
      expect(screen.getByText('AI农药助手')).toBeInTheDocument()
      expect(screen.getByText('专业农化知识智能问答，提供准确的植保咨询服务')).toBeInTheDocument()
      expect(screen.getByText('热门咨询问题')).toBeInTheDocument()

      // Step 2: User clicks on a quick question
      const quickQuestion = screen.getByText('水稻病害防治')
      fireEvent.click(quickQuestion.closest('div[role="button"]') || quickQuestion.parentElement!)

      // Step 3: AI processes the question and shows workflow progress
      await waitFor(() => {
        expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()
      })

      // Step 4: User sees the AI response with specific recommendations
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
        expect(screen.getByText('水稻稻瘟病防治')).toBeInTheDocument()
        expect(screen.getByText('使用方法')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Step 5: User wants more specific information and continues questioning
      expect(screen.getByRole('button', { name: '继续提问' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))

      await waitFor(() => {
        expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      })

      // Step 6: User asks a follow-up question about dosage
      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '三环唑具体用药量是多少' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Step 7: User gets more specific dosage information
      await waitFor(() => {
        expect(screen.getByText('具体用药量建议')).toBeInTheDocument()
        expect(screen.getByText(/15-20克\/亩/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify the complete journey was tracked
      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(2)
      expect(mockConversationManager.startConversation).toHaveBeenCalledTimes(2)
    }, 10000)
  })

  describe('Expert User Journey', () => {
    it('should handle complex technical consultation workflow', async () => {
      // Mock expert-level AI responses
      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete, onWorkflowEvent) => {
        // Simulate complex workflow with multiple analysis steps
        setTimeout(() => {
          onWorkflowEvent?.({
            event: 'workflow_started',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'workflow-1',
              workflow_id: 'expert-consultation',
              inputs: { query, expertise_level: 'advanced' },
              created_at: Date.now(),
            }
          })
        }, 100)

        setTimeout(() => {
          onWorkflowEvent?.({
            event: 'node_started',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'node-1',
              node_id: 'disease-analysis',
              node_type: 'llm',
              title: '病害诊断分析',
              index: 1,
              created_at: Date.now(),
            }
          })
        }, 200)

        setTimeout(() => {
          onWorkflowEvent?.({
            event: 'node_started',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'node-2',
              node_id: 'resistance-check',
              node_type: 'tool',
              title: '抗性风险评估',
              index: 2,
              created_at: Date.now(),
            }
          })
        }, 400)

        setTimeout(() => {
          const expertResponse = `## 综合诊断结果

基于症状描述，初步诊断为：
- **主要病害**: 稻瘟病 (Magnaporthe oryzae)
- **发病程度**: 中等偏重
- **抗性风险**: 低

## 精准防治方案

### 1. 药剂选择
- **首选**: 75%三环唑WP (Tricyclazole) 800倍液
- **轮换**: 40%稻瘟灵EC (Isoprothiolane) 1000倍液
- **复配**: 22%春雷霉素WP + 75%三环唑WP

### 2. 施药技术
- **时期**: 破口期 + 齐穗期
- **用量**: 150-200ml/亩 (制剂量)
- **水量**: 45-60kg/亩
- **间隔**: 7-10天

### 3. 抗性管理
- 轮换作用机理不同的药剂
- 避免连续使用同一药剂超过2次
- 结合农业防治措施

### 4. 效果评估
- 施药后3-5天观察效果
- 7-10天进行全面评估
- 必要时进行补防`

          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: expertResponse,
            created_at: Date.now(),
          })

          setTimeout(() => {
            onWorkflowEvent?.({
              event: 'workflow_finished',
              conversation_id: 'conv-123',
              message_id: 'msg-123',
              created_at: Date.now(),
              task_id: 'task-123',
              workflow_run_id: 'run-123',
              data: {
                id: 'run-123',
                workflow_id: 'expert-consultation',
                status: 'completed',
                outputs: { diagnosis: 'rice_blast', confidence: 0.92 },
                elapsed_time: 2500,
                total_tokens: 680,
                total_steps: 3,
                created_at: Date.now(),
                finished_at: Date.now(),
              }
            })
            
            onComplete?.()
          }, 100)
        }, 800)
      })

      render(<AISearchPage />)

      // Expert user submits detailed technical query
      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      const detailedQuery = '水稻破口期叶片出现梭形褐斑，边缘黄晕，湿度大时有灰绿色霉层，请提供精准防治方案包括抗性管理策略'
      
      fireEvent.change(searchInput, { target: { value: detailedQuery } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should show detailed workflow progress for expert consultation
      await waitFor(() => {
        expect(screen.getByText('病害诊断分析')).toBeInTheDocument()
      }, { timeout: 1000 })

      await waitFor(() => {
        expect(screen.getByText('抗性风险评估')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Should provide comprehensive expert-level response
      await waitFor(() => {
        expect(screen.getByText('综合诊断结果')).toBeInTheDocument()
        expect(screen.getByText('精准防治方案')).toBeInTheDocument()
        expect(screen.getByText('抗性管理')).toBeInTheDocument()
        expect(screen.getByText('效果评估')).toBeInTheDocument()
      }, { timeout: 4000 })

      // Should show high confidence in results
      expect(screen.getByText(/可信度 9[0-9]%/)).toBeInTheDocument()

      // Should extract relevant technical tags
      expect(screen.getByText('病害')).toBeInTheDocument()
      expect(screen.getByText('防治')).toBeInTheDocument()
      expect(screen.getByText('水稻')).toBeInTheDocument()
    }, 8000)
  })

  describe('Mobile User Experience Journey', () => {
    it('should provide optimized mobile experience', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '## 移动端农药建议\n\n针对您的问题，建议使用常用杀菌剂进行防治。具体用法请参考产品说明书。',
            created_at: Date.now(),
          })
          onComplete?.()
        }, 200)
      })

      render(<AISearchPage />)

      // Mobile user should see touch-friendly interface
      expect(screen.getByPlaceholderText(/描述您的农化问题/)).toBeInTheDocument()

      // Quick questions should be easily tappable
      const quickQuestions = screen.getAllByText(/水稻病害|玉米虫害|除草剂|果树病虫害/)
      expect(quickQuestions.length).toBeGreaterThan(0)

      // Test touch interaction
      fireEvent.click(screen.getByText('水稻病害防治'))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Mobile-optimized results should be displayed
      expect(screen.getByText('移动端农药建议')).toBeInTheDocument()
    }, 5000)
  })

  describe('Error Recovery Journey', () => {
    it('should guide user through error recovery process', async () => {
      let attemptCount = 0

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        attemptCount++
        
        if (attemptCount === 1) {
          // First attempt fails
          setTimeout(() => {
            onError?.(new Error('网络连接超时，请检查网络设置后重试'))
          }, 500)
        } else if (attemptCount === 2) {
          // Second attempt partially succeeds but fails
          setTimeout(() => {
            onChunk?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: '正在为您查找相关信息...',
              created_at: Date.now(),
            })
          }, 100)
          
          setTimeout(() => {
            onError?.(new Error('服务暂时不可用，请稍后再试'))
          }, 800)
        } else {
          // Third attempt succeeds
          setTimeout(() => {
            onChunk?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: '## 重试成功\n\n经过多次尝试，现在为您提供准确的农药使用建议。请注意按照推荐剂量使用。',
              created_at: Date.now(),
            })
            onComplete?.()
          }, 200)
        }
      })

      render(<AISearchPage />)

      // User starts search
      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '错误恢复测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // First error occurs
      await waitFor(() => {
        expect(screen.getByText('搜索遇到问题')).toBeInTheDocument()
        expect(screen.getByText('网络连接超时，请检查网络设置后重试')).toBeInTheDocument()
      }, { timeout: 2000 })

      // User retries
      fireEvent.click(screen.getByRole('button', { name: '重试搜索' }))

      // Partial success then second error
      await waitFor(() => {
        expect(screen.getByText('AI正在回答...')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('服务暂时不可用，请稍后再试')).toBeInTheDocument()
      }, { timeout: 2000 })

      // User retries again
      fireEvent.click(screen.getByRole('button', { name: '重试搜索' }))

      // Finally succeeds
      await waitFor(() => {
        expect(screen.getByText('重试成功')).toBeInTheDocument()
        expect(screen.getByText('经过多次尝试，现在为您提供准确的农药使用建议')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(attemptCount).toBe(3)
      expect(mockConversationManager.clearConversation).toHaveBeenCalledTimes(2) // Called on each error
    }, 15000)
  })

  describe('Multi-Session Conversation Journey', () => {
    it('should support extended consultation sessions', async () => {
      const conversations: string[] = []

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          let response = ''
          
          if (query.includes('水稻病害')) {
            response = '## 水稻病害防治\n\n请详细描述具体症状，我可以提供更精准的诊断。'
            conversations.push('initial_consultation')
          } else if (query.includes('叶片黄斑')) {
            response = '## 症状分析\n\n根据叶片黄斑症状，可能是细菌性条斑病。建议使用铜制剂防治。'
            conversations.push('symptom_analysis')
          } else if (query.includes('铜制剂用量')) {
            response = '## 用药指导\n\n硫酸铜钙可湿性粉剂500-600倍液，7-10天施药一次。'
            conversations.push('dosage_guidance')
          } else if (query.includes('预防措施')) {
            response = '## 综合防治\n\n包括种子处理、田间管理、药剂防治的综合方案。'
            conversations.push('comprehensive_plan')
          }

          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: response,
            created_at: Date.now(),
          })
          
          onComplete?.()
        }, 200)
      })

      render(<AISearchPage />)

      // Session 1: General inquiry
      let searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻病害防治咨询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('请详细描述具体症状')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Session 2: Specific symptom description
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
      await waitFor(() => {
        expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      })

      searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻叶片出现黄斑，边缘有水渍状' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('症状分析')).toBeInTheDocument()
        expect(screen.getByText('细菌性条斑病')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Session 3: Dosage inquiry
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
      await waitFor(() => {
        expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      })

      searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '铜制剂具体用量和使用方法' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('用药指导')).toBeInTheDocument()
        expect(screen.getByText(/500-600倍液/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Session 4: Prevention measures
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
      await waitFor(() => {
        expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      })

      searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '还有什么预防措施' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('综合防治')).toBeInTheDocument()
        expect(screen.getByText('综合方案')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify the complete consultation journey
      expect(conversations).toEqual([
        'initial_consultation',
        'symptom_analysis', 
        'dosage_guidance',
        'comprehensive_plan'
      ])
      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(4)
      expect(mockConversationManager.startConversation).toHaveBeenCalledTimes(4)
    }, 20000)
  })
})