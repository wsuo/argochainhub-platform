import { httpClient } from './httpClient';
import { 
  PopularQueriesParams, 
  PopularQueriesResponse, 
  PopularQuestionCard 
} from '@/types/popularQueries';

const API_PREFIX = '/api/v1/ai/conversations/popular';

// 生成问题分类标题
const generateQuestionTitle = (query: string): string => {
  // 根据问题内容生成分类标题
  const categories = [
    { keywords: ['水稻', '稻'], title: '水稻种植' },
    { keywords: ['玉米'], title: '玉米种植' },
    { keywords: ['小麦'], title: '小麦种植' },
    { keywords: ['除草剂', '除草'], title: '除草方案' },
    { keywords: ['杀虫剂', '杀虫', '虫害'], title: '虫害防治' },
    { keywords: ['杀菌剂', '杀菌', '病害'], title: '病害防治' },
    { keywords: ['果树', '苹果', '梨', '桃'], title: '果树管理' },
    { keywords: ['蔬菜', '番茄', '黄瓜'], title: '蔬菜种植' },
    { keywords: ['公司', '产品', '厂家'], title: '产品咨询' },
    { keywords: ['用量', '剂量', '配比'], title: '用药指导' },
    { keywords: ['价格', '多少钱'], title: '价格咨询' }
  ];
  
  // 匹配分类
  for (const category of categories) {
    if (category.keywords.some(keyword => query.includes(keyword))) {
      return category.title;
    }
  }
  
  // 如果没有匹配到分类，使用通用标题
  return '农化咨询';
};

export class PopularQueriesService {
  /**
   * 获取热门咨询问题
   */
  static async getPopularQueries(params: PopularQueriesParams = {}): Promise<PopularQueriesResponse> {
    const searchParams = new URLSearchParams();
    
    // 设置默认参数
    const defaultParams = {
      limit: 4,
      minCount: 1,
      ...params
    };
    
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const url = `${API_PREFIX}/queries?${searchParams.toString()}`;
    
    return httpClient.get<PopularQueriesResponse>(url, {
      module: 'ai-search',
      action: 'read',
      resourceType: 'popular-queries',
    });
  }
  
  /**
   * 将API响应转换为UI卡片数据
   */
  static transformToQuestionCards(response: PopularQueriesResponse): PopularQuestionCard[] {
    if (!response.success || !response.data?.data) {
      return [];
    }
    
    return response.data.data.map((item, index) => ({
      id: `popular-${index}`,
      icon: '', // 不再使用图标
      text: generateQuestionTitle(item.query),
      query: item.query,
      count: item.count,
      percentage: item.percentage
    }));
  }
  
  /**
   * 获取热门问题卡片（适用于AI搜索页面）
   */
  static async getPopularQuestionCards(limit: number = 4): Promise<PopularQuestionCard[]> {
    try {
      const response = await this.getPopularQueries({ 
        limit,
        minCount: 1  // 降低最小次数要求，确保能获取到数据
      });
      
      const cards = this.transformToQuestionCards(response);
      
      // 如果获取到的热门问题少于4个，用默认问题补充
      if (cards.length < limit) {
        const defaultCards = this.getDefaultQuestions();
        const needed = limit - cards.length;
        cards.push(...defaultCards.slice(0, needed));
      }
      
      return cards.slice(0, limit);
    } catch (error) {
      console.error('获取热门问题失败:', error);
      // 返回默认的热门问题作为备选
      return this.getDefaultQuestions();
    }
  }
  
  /**
   * 获取默认的热门问题（备选方案）
   */
  private static getDefaultQuestions(): PopularQuestionCard[] {
    return [
      { 
        id: 'default-1',
        icon: "", 
        text: "病害防治", 
        query: "水稻常见病害如何防治",
        count: 0,
        percentage: 0
      },
      { 
        id: 'default-2',
        icon: "", 
        text: "虫害防治", 
        query: "玉米草地贪夜蛾防治方案",
        count: 0,
        percentage: 0
      },
      { 
        id: 'default-3',
        icon: "", 
        text: "除草方案", 
        query: "小麦田除草剂推荐",
        count: 0,
        percentage: 0
      },
      { 
        id: 'default-4',
        icon: "", 
        text: "果树管理", 
        query: "苹果树病虫害综合防治",
        count: 0,
        percentage: 0
      }
    ];
  }
}