import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const AIQueryBox = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    // Simulate AI query processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    // Here would normally navigate to AI query page or show results
    console.log("AI Query:", query);
  };

  const exampleQueries = [
    "推荐用于番茄晚疫病的杀菌剂",
    "查询草铵膦在欧盟的登记状况",
    "有什么有效成分可以防治玉米螟？",
    "寻找环保型除草剂供应商"
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-agro-green-light border-primary/20 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-agro-blue rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">AI农药智能查询</h3>
      </div>
      
      <p className="text-muted-foreground mb-4">
        基于专业农药知识库，为您提供精准、快速的智能问答服务
      </p>
      
      <div className="space-y-4">
        <Textarea
          placeholder="请输入您的问题，例如：推荐用于小麦锈病的杀菌剂..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[100px] resize-none border-primary/30 focus:border-primary"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            按Enter发送，Shift+Enter换行
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="ml-2">{isLoading ? "查询中..." : "发送查询"}</span>
          </Button>
        </div>
        
        <div className="border-t border-border pt-4">
          <div className="text-sm text-muted-foreground mb-2">常用查询示例：</div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7 border-primary/30 hover:bg-primary/10 hover:border-primary"
                onClick={() => setQuery(example)}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};