// Dify AI搜索服务配置
const DIFY_API_BASE_URL = import.meta.env.VITE_DIFY_API_BASE_URL || 'http://100.101.144.72/v1';
const DIFY_APP_ID = import.meta.env.VITE_DIFY_APP_ID || '54de64f0-a411-44bd-be9c-8cd68f6a0238';
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY || 'app-pHmzn3L1TMOrRWvoIa8mr6w0';

// 工作流事件类型定义
export interface WorkflowStartedEvent {
  event: 'workflow_started';
  conversation_id: string;
  message_id: string;
  created_at: number;
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    inputs: Record<string, any>;
    created_at: number;
  };
}

export interface NodeStartedEvent {
  event: 'node_started';
  conversation_id: string;
  message_id: string;
  created_at: number;
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: any;
    created_at: number;
    extras?: Record<string, any>;
    parallel_id?: string;
    parallel_start_node_id?: string;
    parent_parallel_id?: string;
    parent_parallel_start_node_id?: string;
    iteration_id?: string;
    loop_id?: string;
    parallel_run_id?: string;
    agent_strategy?: any;
  };
}

export interface MessageEvent {
  event: 'message';
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

// 联合类型，包含所有可能的事件
export type DifyStreamEvent = WorkflowStartedEvent | NodeStartedEvent | MessageEvent;

// 工作流状态信息
export interface WorkflowStatus {
  isRunning: boolean;
  currentNode?: {
    title: string;
    nodeType: string;
    index: number;
  };
  completedNodes: Array<{
    title: string;
    nodeType: string;
    index: number;
  }>;
}

// 数据类型定义
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DifyChatRequest {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
  files?: Array<{
    type: string;
    transfer_method: string;
    url: string;
  }>;
}

export interface DifyChatResponse {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

export interface StreamChunk {
  event: string;
  data: string;
}

// AI搜索服务类
export class AISearchService {
  private static conversationId: string | null = null;
  private static userId: string = 'user-' + Math.random().toString(36).substr(2, 9);

  /**
   * 发送聊天消息（流式传输）
   */
  static async sendMessage(
    message: string,
    onChunk?: (chunk: DifyChatResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    onWorkflowEvent?: (event: DifyStreamEvent) => void
  ): Promise<void> {
    try {
      const requestBody: DifyChatRequest = {
        inputs: {},
        query: message,
        response_mode: 'streaming',
        conversation_id: this.conversationId || undefined,
        user: this.userId,
      };

      const response = await fetch(`${DIFY_API_BASE_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                onComplete?.();
                return;
              }

              try {
                const event: DifyStreamEvent = JSON.parse(data);
                
                // 保存conversation_id用于后续对话
                if ('conversation_id' in event && event.conversation_id && !this.conversationId) {
                  this.conversationId = event.conversation_id;
                }

                // 处理不同类型的事件
                if (event.event === 'workflow_started') {
                  onWorkflowEvent?.(event as WorkflowStartedEvent);
                } else if (event.event === 'node_started') {
                  onWorkflowEvent?.(event as NodeStartedEvent);
                } else if (event.event === 'message') {
                  // 兼容旧版本的回调
                  onChunk?.(event as any);
                  onWorkflowEvent?.(event as MessageEvent);
                }
              } catch (parseError) {
                console.warn('解析流数据失败:', parseError, 'Data:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('AI搜索请求失败:', error);
      onError?.(error as Error);
    }
  }

  /**
   * 发送聊天消息（阻塞模式）
   */
  static async sendMessageBlocking(message: string): Promise<DifyChatResponse> {
    try {
      const requestBody: DifyChatRequest = {
        inputs: {},
        query: message,
        response_mode: 'blocking',
        conversation_id: this.conversationId || undefined,
        user: this.userId,
      };

      const response = await fetch(`${DIFY_API_BASE_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DifyChatResponse = await response.json();
      
      // 保存conversation_id用于后续对话
      if (result.conversation_id && !this.conversationId) {
        this.conversationId = result.conversation_id;
      }

      return result;
    } catch (error) {
      console.error('AI搜索请求失败:', error);
      throw error;
    }
  }

  /**
   * 重置对话
   */
  static resetConversation(): void {
    this.conversationId = null;
    this.userId = 'user-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取当前对话ID
   */
  static getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * 设置对话ID
   */
  static setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
  }

  /**
   * 获取用户ID
   */
  static getUserId(): string {
    return this.userId;
  }

  /**
   * 设置用户ID
   */
  static setUserId(userId: string): void {
    this.userId = userId;
  }
}

export default AISearchService;
