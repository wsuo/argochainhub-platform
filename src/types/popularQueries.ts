// 热门问题查询参数接口
export interface PopularQueriesParams {
  limit?: number;        // 返回数量，默认10，最大50
  minCount?: number;     // 最小提问次数，默认2
  userType?: 'user' | 'guest';  // 用户类型筛选
  startDate?: string;    // 开始日期 YYYY-MM-DD
  endDate?: string;      // 结束日期 YYYY-MM-DD
}

// 单个热门问题数据结构
export interface PopularQueryItem {
  query: string;         // 问题内容
  count: number;         // 提问次数
  latestDate: string;    // 最新提问时间
  percentage: number;    // 占总提问的百分比
}

// 热门问题响应数据结构
export interface PopularQueriesData {
  data: PopularQueryItem[];
  totalQueries: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// API响应结构
export interface PopularQueriesResponse {
  success: boolean;
  message: string;
  data: PopularQueriesData;
}

// 热门问题卡片数据（用于UI展示）
export interface PopularQuestionCard {
  id: string;
  icon: string;
  text: string;
  query: string;
  count: number;
  percentage: number;
}