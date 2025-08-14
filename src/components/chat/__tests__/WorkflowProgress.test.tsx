import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../test/utils'
import { WorkflowProgress } from '@/components/chat/WorkflowProgress'
import { WorkflowStatus } from '@/services/aiSearchService'

describe('WorkflowProgress Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visibility and State', () => {
    it('should not render when no workflow is running and no completed nodes', () => {
      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: []
      }

      const { container } = render(<WorkflowProgress status={status} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render when workflow is running', () => {
      const status: WorkflowStatus = {
        isRunning: true,
        completedNodes: [],
        currentNode: {
          title: '正在分析问题',
          nodeType: 'analysis',
          index: 1
        }
      }

      render(<WorkflowProgress status={status} />)
      
      expect(screen.getByText('AI工作流执行中')).toBeInTheDocument()
      expect(screen.getByText('正在执行: 正在分析问题')).toBeInTheDocument()
    })

    it('should render completed state with history', () => {
      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: [
          { title: '问题分析完成', nodeType: 'analysis', index: 1 },
          { title: '知识检索完成', nodeType: 'retrieval', index: 2 }
        ]
      }

      render(<WorkflowProgress status={status} />)
      
      expect(screen.getByText('执行完成')).toBeInTheDocument()
      expect(screen.getByText('工作流已完成 • 2个步骤')).toBeInTheDocument()
    })
  })

  describe('History Expansion', () => {
    it('should expand and collapse history correctly', async () => {
      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: [
          { title: '步骤1完成', nodeType: 'step1', index: 1 },
          { title: '步骤2完成', nodeType: 'step2', index: 2 },
          { title: '步骤3完成', nodeType: 'step3', index: 3 }
        ]
      }

      const { user } = render(<WorkflowProgress status={status} />)

      // History should be collapsed by default
      expect(screen.queryByText('步骤1完成')).not.toBeInTheDocument()
      expect(screen.getByText('工作流已完成 • 3个步骤')).toBeInTheDocument()

      // Click to expand
      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('执行历史 (3个步骤):')).toBeInTheDocument()
      expect(screen.getByText('步骤1完成')).toBeInTheDocument()
      expect(screen.getByText('步骤2完成')).toBeInTheDocument()
      expect(screen.getByText('步骤3完成')).toBeInTheDocument()

      // Click to collapse
      await user.click(expandButton)
      
      expect(screen.queryByText('步骤1完成')).not.toBeInTheDocument()
      expect(screen.getByText('工作流已完成 • 3个步骤')).toBeInTheDocument()
    })

    it('should not show expand button when no completed nodes', () => {
      const status: WorkflowStatus = {
        isRunning: true,
        completedNodes: [],
        currentNode: {
          title: '当前执行节点',
          nodeType: 'current',
          index: 1
        }
      }

      render(<WorkflowProgress status={status} />)
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('should apply correct styling for running state', () => {
      const status: WorkflowStatus = {
        isRunning: true,
        completedNodes: [],
        currentNode: {
          title: '执行中',
          nodeType: 'running',
          index: 1
        }
      }

      render(<WorkflowProgress status={status} />)
      
      const container = screen.getByText('AI工作流执行中').closest('div')
      expect(container).toHaveClass('from-blue-50', 'to-indigo-50', 'border-blue-200')
    })

    it('should apply correct styling for completed state', () => {
      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: [
          { title: '已完成', nodeType: 'completed', index: 1 }
        ]
      }

      render(<WorkflowProgress status={status} />)
      
      const container = screen.getByText('执行完成').closest('div')
      expect(container).toHaveClass('from-green-50', 'to-emerald-50', 'border-green-200')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined current node', () => {
      const status: WorkflowStatus = {
        isRunning: true,
        completedNodes: [],
        currentNode: undefined
      }

      render(<WorkflowProgress status={status} />)
      
      expect(screen.getByText('AI工作流执行中')).toBeInTheDocument()
      expect(screen.queryByText('正在执行:')).not.toBeInTheDocument()
    })

    it('should handle very long node titles', () => {
      const longTitle = '这是一个非常非常长的节点标题，用来测试组件是否能够正确处理长文本内容而不会破坏布局'
      
      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: [
          { title: longTitle, nodeType: 'long', index: 1 }
        ]
      }

      render(<WorkflowProgress status={status} />)

      const { user } = render(<WorkflowProgress status={status} />)
      const expandButton = screen.getByRole('button')
      user.click(expandButton)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle large number of completed nodes', () => {
      const manyNodes = Array.from({ length: 20 }, (_, index) => ({
        title: `步骤 ${index + 1}`,
        nodeType: `step${index + 1}`,
        index: index + 1
      }))

      const status: WorkflowStatus = {
        isRunning: false,
        completedNodes: manyNodes
      }

      render(<WorkflowProgress status={status} />)
      
      expect(screen.getByText('工作流已完成 • 20个步骤')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const status: WorkflowStatus = {
        isRunning: true,
        completedNodes: []
      }

      render(<WorkflowProgress status={status} className="custom-class" />)
      
      const container = screen.getByText('AI工作流执行中').closest('div')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Real-world Workflow Simulation', () => {
    it('should handle complete workflow lifecycle', async () => {
      const { rerender, user } = render(
        <WorkflowProgress 
          status={{ isRunning: false, completedNodes: [] }} 
        />
      )

      // Initially not visible
      expect(screen.queryByText('AI工作流执行中')).not.toBeInTheDocument()

      // Workflow starts
      rerender(
        <WorkflowProgress 
          status={{
            isRunning: true,
            completedNodes: [],
            currentNode: { title: '开始分析', nodeType: 'start', index: 0 }
          }} 
        />
      )

      expect(screen.getByText('AI工作流执行中')).toBeInTheDocument()
      expect(screen.getByText('正在执行: 开始分析')).toBeInTheDocument()

      // Progress through nodes
      rerender(
        <WorkflowProgress 
          status={{
            isRunning: true,
            completedNodes: [
              { title: '开始分析', nodeType: 'start', index: 0 }
            ],
            currentNode: { title: '知识检索', nodeType: 'retrieval', index: 1 }
          }} 
        />
      )

      expect(screen.getByText('正在执行: 知识检索')).toBeInTheDocument()

      // Workflow completes
      rerender(
        <WorkflowProgress 
          status={{
            isRunning: false,
            completedNodes: [
              { title: '开始分析', nodeType: 'start', index: 0 },
              { title: '知识检索', nodeType: 'retrieval', index: 1 },
              { title: '答案生成', nodeType: 'generation', index: 2 }
            ]
          }} 
        />
      )

      expect(screen.getByText('执行完成')).toBeInTheDocument()
      expect(screen.getByText('工作流已完成 • 3个步骤')).toBeInTheDocument()

      // Check history expansion
      const expandButton = screen.getByRole('button')
      await user.click(expandButton)

      expect(screen.getByText('开始分析')).toBeInTheDocument()
      expect(screen.getByText('知识检索')).toBeInTheDocument()
      expect(screen.getByText('答案生成')).toBeInTheDocument()
    })
  })
})