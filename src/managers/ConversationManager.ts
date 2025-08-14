/**
 * AI对话管理器
 * 负责管理AI对话的完整生命周期，包括数据收集、缓存和持久化
 */

import { DifyStreamEvent, MessageEvent, WorkflowStartedEvent, NodeStartedEvent, NodeFinishedEvent, WorkflowFinishedEvent, MessageEndEvent } from '@/services/aiSearchService';
import { ConversationService, StoreConversationRequest } from '@/services/conversationService';
import { getOrCreateGuestId } from '@/utils/guestId';

// 对话数据接口
interface ConversationData {
  conversationId: string; // 我们的临时ID
  difyConversationId?: string; // Dify返回的真实ID
  guestId: string;
  userQuery: string;
  userInputs: Record<string, unknown>;
  user: string;
  startTime: number;
  streamMessages: Array<{
    event: string;
    data: unknown;
    timestamp: number;
  }>;
  finalAnswer: string | null;
  usageStats: unknown | null;
  workflowData: unknown | null;
}

/**
 * 对话管理器类
 * 单例模式，全局管理AI对话记录
 */
export class ConversationManager {
  private static instance: ConversationManager | null = null;
  private conversations = new Map<string, ConversationData>();

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  /**
   * 开始新对话或继续现有对话
   * @param queryData 对话数据
   * @returns 对话数据对象
   */
  startConversation(queryData: {
    conversation_id: string;
    query: string;
    inputs?: Record<string, unknown>;
    user: string;
  }): ConversationData {
    // 检查是否已存在此对话
    let conversationData = this.conversations.get(queryData.conversation_id);
    
    if (conversationData) {
      // 继续现有对话 - 不需要重新创建，直接返回现有数据
      console.log('继续现有对话:', conversationData.conversationId);
      return conversationData;
    } else {
      // 创建新对话
      conversationData = {
        conversationId: queryData.conversation_id,
        difyConversationId: undefined, // 等待Dify事件中的真实ID
        guestId: getOrCreateGuestId(),
        userQuery: queryData.query,
        userInputs: queryData.inputs || {},
        user: queryData.user,
        startTime: Date.now(),
        streamMessages: [],
        finalAnswer: null,
        usageStats: null,
        workflowData: null,
      };

      this.conversations.set(queryData.conversation_id, conversationData);
      console.log('开始新对话:', conversationData.conversationId);
      return conversationData;
    }
  }

  /**
   * 处理EventStream消息
   * @param conversationId 对话ID
   * @param eventData 事件数据
   */
  onStreamMessage(conversationId: string, eventData: DifyStreamEvent): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      console.warn('未找到对话:', conversationId);
      return;
    }

    // 从Dify事件中获取真实的conversationId
    if ('conversation_id' in eventData && eventData.conversation_id && !conversation.difyConversationId) {
      conversation.difyConversationId = eventData.conversation_id;
      console.log('获取到Dify对话ID:', conversation.difyConversationId);
    }

    // 添加事件到流消息记录
    conversation.streamMessages.push({
      event: eventData.event,
      data: eventData,
      timestamp: Date.now(),
    });

    // 处理特定类型事件
    switch (eventData.event) {
      case 'workflow_started':
        this.handleWorkflowStarted(conversation, eventData as WorkflowStartedEvent);
        break;
      case 'node_started':
        this.handleNodeStarted(conversation, eventData as NodeStartedEvent);
        break;
      case 'node_finished':
        this.handleNodeFinished(conversation, eventData as NodeFinishedEvent);
        break;
      case 'message':
        this.handleMessage(conversation, eventData as MessageEvent);
        break;
      case 'workflow_finished':
        this.handleWorkflowFinished(conversation, eventData as WorkflowFinishedEvent);
        break;
      case 'message_end':
        this.handleMessageEnd(conversation, eventData as MessageEndEvent);
        break;
    }
  }

  /**
   * 处理工作流开始事件
   */
  private handleWorkflowStarted(conversation: ConversationData, event: WorkflowStartedEvent): void {
    console.log('工作流开始:', event.data);
  }

  /**
   * 处理节点开始事件
   */
  private handleNodeStarted(conversation: ConversationData, event: NodeStartedEvent): void {
    console.log('节点开始:', event.data.title);
  }

  /**
   * 处理节点完成事件
   */
  private handleNodeFinished(conversation: ConversationData, event: NodeFinishedEvent): void {
    console.log('节点完成:', event.data.title);
  }

  /**
   * 处理消息事件
   */
  private handleMessage(conversation: ConversationData, event: MessageEvent): void {
    if (event.answer) {
      // 累积最终答案
      if (conversation.finalAnswer) {
        conversation.finalAnswer += event.answer;
      } else {
        conversation.finalAnswer = event.answer;
      }
    }
  }

  /**
   * 处理工作流完成事件
   */
  private handleWorkflowFinished(conversation: ConversationData, event: WorkflowFinishedEvent): void {
    if (event.data?.outputs?.answer && typeof event.data.outputs.answer === 'string') {
      conversation.finalAnswer = event.data.outputs.answer;
    }
    
    // 转换workflowData字段命名：从下划线转为驼峰
    const originalData = event.data;
    const transformedData: Record<string, unknown> = {
      ...originalData,
      // 转换字段命名
      workflowId: originalData.workflow_id,
      elapsedTime: originalData.elapsed_time,
      totalTokens: originalData.total_tokens,
      totalSteps: originalData.total_steps,
      exceptionsCount: originalData.exceptions_count,
      createdBy: originalData.created_by,  // 这个字段结构正确，直接复制
      createdAt: originalData.created_at,
      finishedAt: originalData.finished_at
    };
    
    // 移除原有的下划线字段
    delete transformedData.workflow_id;
    delete transformedData.elapsed_time;
    delete transformedData.total_tokens;
    delete transformedData.total_steps;
    delete transformedData.exceptions_count;
    // 注意：created_by, created_at, finished_at 已经从原对象复制过来了，需要删除下划线版本
    if ('created_by' in transformedData) delete transformedData.created_by;
    if ('finished_at' in transformedData) delete transformedData.finished_at;
    
    conversation.workflowData = transformedData;
    
    console.log('工作流完成，workflowData已转换为驼峰命名:', conversation.workflowData);
  }

  /**
   * 处理消息结束事件
   */
  private handleMessageEnd(conversation: ConversationData, event: MessageEndEvent): void {
    if (event.metadata?.usage) {
      // 转换usage数据格式以匹配后端期望的格式
      const usage = event.metadata.usage;
      conversation.usageStats = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        totalPrice: usage.total_price,
        currency: usage.currency,
        latency: usage.latency
      };
    }
    console.log('消息结束，使用统计:', conversation.usageStats);
  }

  /**
   * 完成对话并保存到后端
   * @param conversationId 对话ID
   * @returns Promise<boolean> 是否保存成功
   */
  async finishConversation(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      console.warn('未找到对话:', conversationId);
      return false;
    }

    try {
      const duration = Date.now() - conversation.startTime;
      
      const storeRequest: StoreConversationRequest = {
        conversationId: conversation.difyConversationId || conversation.conversationId, // 优先使用Dify的ID
        guestId: conversation.guestId,
        userQuery: conversation.userQuery,
        userInputs: conversation.userInputs,
        user: conversation.user,
        finalAnswer: conversation.finalAnswer || undefined,
        usageStats: conversation.usageStats,
        workflowData: conversation.workflowData,
        // 移除 streamMessages 字段以减少请求体大小，避免413错误
        // streamMessages: conversation.streamMessages, // 移除这行
        duration,
      };

      const response = await ConversationService.storeConversation(storeRequest);
      
      if (response.success) {
        console.log('对话保存成功:', response.data);
        return true;
      } else {
        console.error('对话保存失败:', response.message);
        return false;
      }
    } catch (error) {
      console.error('保存对话记录失败:', error);
      return false;
    } finally {
      // 清理本地缓存
      this.conversations.delete(conversationId);
    }
  }

  /**
   * 获取对话数据（调试用）
   * @param conversationId 对话ID
   * @returns 对话数据或null
   */
  getConversation(conversationId: string): ConversationData | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * 获取所有活跃对话（调试用）
   * @returns 活跃对话列表
   */
  getActiveConversations(): ConversationData[] {
    return Array.from(this.conversations.values());
  }

  /**
   * 清理指定对话
   * @param conversationId 对话ID
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * 清理所有对话
   */
  clearAllConversations(): void {
    this.conversations.clear();
  }
}

// 导出全局实例
export const conversationManager = ConversationManager.getInstance();
export default conversationManager;