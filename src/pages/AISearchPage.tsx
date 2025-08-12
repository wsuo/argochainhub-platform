import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Search, Sparkles, Bot, History, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const AISearchPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchQuery(query);
    
    // TODO: 集成AI搜索API
    setTimeout(() => {
      setSearchResults({
        query,
        results: [
          {
            id: '1',
            title: '针对水稻稻瘟病的防治方案',
            content: '基于您的描述，推荐使用三环唑配合嘧菌酯的组合方案。三环唑是一种高效的稻瘟病专用杀菌剂，主要作用机理是抑制病菌黑色素的生物合成。\n\n使用方法：\n• 75%可湿性粉剂1000-1500倍液\n• 在水稻分蘖期和穗期各施用一次\n• 间隔7-10天重复施药\n• 配合嘧菌酯可提高防效',
            confidence: 0.95,
            tags: ['稻瘟病', '三环唑', '嘧菌酯', '水稻']
          },
          {
            id: '2',
            title: '预防性用药建议',
            content: '除治疗用药外，建议在关键期进行预防：\n\n预防药剂选择：\n• 春雷霉素：生物农药，安全性高\n• 稻瘟灵：预防效果好，持效期长\n• 使用时期：4-5叶期开始预防',
            confidence: 0.88,
            tags: ['预防用药', '春雷霉素', '稻瘟灵']
          }
        ]
      });
      setIsSearching(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const quickQuestions = [
    { icon: "🌾", text: "水稻病害防治", query: "水稻常见病害如何防治" },
    { icon: "🌽", text: "玉米虫害", query: "玉米草地贪夜蛾防治方案" },
    { icon: "🌿", text: "除草剂选择", query: "小麦田除草剂推荐" },
    { icon: "🍎", text: "果树病虫害", query: "苹果树病虫害综合防治" }
  ];

  return (
    <Layout userType="buyer">
      <div className="max-w-4xl mx-auto space-y-16 pt-16">
        {/* 头部标题区域 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-8 shadow-2xl shadow-primary/20">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary to-agro-blue bg-clip-text text-transparent mb-4 leading-tight">
            AI农药助手
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            专业农化知识智能问答，提供准确的植保咨询服务
          </p>
        </div>

        {/* 主搜索区域 - 优化的搜索框和按钮 */}
        <div>
          <form onSubmit={handleSubmit}>
            {/* 搜索框容器 */}
            <div className="relative max-w-3xl mx-auto">
              <div className="relative flex items-center">
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10">
                  {isSearching ? (
                    <div className="animate-spin">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="描述您的农化问题，例如：玉米叶片黄斑、病害防治..."
                  className="w-full pl-14 pr-32 py-4 text-lg bg-white/90 backdrop-blur-sm border-2 border-gray-200/50 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 rounded-2xl transition-all duration-300 placeholder:text-gray-400 shadow-lg shadow-gray-200/30"
                  disabled={isSearching}
                />
                
                {/* 内联的AI搜索按钮 */}
                <Button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      AI搜索
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* 快捷问题 */}
        {!searchResults && !isSearching && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl mb-4 shadow-lg shadow-amber-400/20">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                热门咨询问题
              </h3>
              <p className="text-gray-600">点击以下问题快速开始咨询</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickQuestions.map((item, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => {
                    setSearchQuery(item.query);
                    handleSearch(item.query);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary/10 to-agro-blue/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-agro-blue/20 transition-all duration-300">
                          <div className="text-2xl">{item.icon}</div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2">
                          {item.text}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {item.query}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果区域 */}
        {isSearching && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-agro-blue rounded-3xl mb-8 animate-pulse shadow-2xl shadow-primary/30">
              <Sparkles className="w-10 h-10 text-white animate-spin" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">AI正在思考中...</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">正在分析您的问题，为您提供最专业的建议</p>
            
            {/* 加载动画效果 */}
            <div className="flex justify-center space-x-3">
              <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-4 h-4 bg-agro-blue rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-4 h-4 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}

        {searchResults && !isSearching && (
          <div className="space-y-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-xl shadow-green-500/20">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">解答结果</h2>
              <p className="text-lg text-gray-600">
                关于 "<span className="font-semibold text-primary">{searchResults.query}</span>" 的专业建议
              </p>
            </div>

            <div className="space-y-8">
              {searchResults.results.map((result, index) => (
                <Card key={result.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6 mb-6">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-r from-primary/10 to-agro-blue/10 rounded-2xl flex items-center justify-center">
                          {index === 0 ? (
                            <Lightbulb className="w-7 h-7 text-primary" />
                          ) : (
                            <BookOpen className="w-7 h-7 text-agro-blue" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {result.title}
                        </h3>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-600">
                              可信度 {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                        {result.content}
                      </div>
                    </div>

                    {result.tags && (
                      <div className="flex flex-wrap gap-3">
                        {result.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 继续提问 */}
            <Card>
              <CardContent className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-amber-400/20">
                  <History className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-800 mb-3">
                  还有其他问题？
                </h4>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  继续提问，获得更全面的植保解决方案
                </p>
                <Button
                  onClick={() => {
                    setSearchResults(null);
                    setSearchQuery('');
                  }}
                  className="bg-gradient-to-r from-primary to-agro-blue hover:from-primary-dark hover:to-agro-blue/90 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transform hover:scale-105 active:scale-95"
                >
                  继续提问
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AISearchPage;