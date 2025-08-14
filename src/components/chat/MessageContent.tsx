import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTypewriterEffect } from '@/hooks/useTypewriterEffect';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  sender: 'user' | 'ai';
  useTypewriter?: boolean; // 新增参数控制是否使用打字机效果
}

export const MessageContent = ({ content, isStreaming, sender, useTypewriter = false }: MessageContentProps) => {
  // 确保 content 不为空
  const safeContent = content || '';
  
  // 预处理内容以正确处理换行符
  const processedContent = React.useMemo(() => {
    if (sender === 'ai') {
      // 对于AI消息，需要处理换行符以确保Markdown正确渲染
      return safeContent
        // 保留已有的双换行符（段落分隔）
        .replace(/\n\n/g, '___DOUBLE_NEWLINE___')
        // 处理特殊情况：避免序号后意外换行
        // 匹配 "数字." 后面紧跟的换行符，如果后面是空格+文本，则保持在同一行
        .replace(/(\d+\.)\n(\s+)/g, '$1 $2')
        // 处理列表项中的缩进换行：保留缩进结构但避免过度换行
        .replace(/\n(\s{4,}-\s)/g, '  \n$1')
        // 将普通的单个换行符转换为Markdown的硬换行（两个空格+换行）
        .replace(/\n/g, '  \n')
        // 恢复双换行符
        .replace(/___DOUBLE_NEWLINE___/g, '\n\n');
    }
    return safeContent;
  }, [safeContent, sender]);
  
  // 只有明确指定使用打字机效果且正在流式传输时才使用
  const shouldUseTypewriter = useTypewriter && sender === 'ai' && isStreaming && processedContent.length > 0;
  
  const { displayedText, isTyping } = useTypewriterEffect(
    shouldUseTypewriter ? processedContent : '',
    {
      speed: 15, // 打字速度，越小越快 - 优化后的速度
      chunkSize: processedContent.length > 500 ? 8 : 3, // 长文本使用更大的分块
    }
  );
  
  // 当不使用打字机效果时显示原文，使用打字机效果时显示逐步显示的文本
  const textToShow = shouldUseTypewriter ? displayedText : processedContent;

  // 用户消息使用普通文本，AI消息使用Markdown渲染
  if (sender === 'user') {
    return (
      <div className="text-sm whitespace-pre-wrap">
        {textToShow}
        {/* 显示光标效果（用户消息不需要光标） */}
      </div>
    );
  }

  // AI消息使用Markdown渲染
  return (
    <div className="ai-message-content prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 简化组件映射，添加适当的样式
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-md font-bold mb-2 mt-3">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-bold mb-1 mt-2">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 ml-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>,
          pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">{children}</blockquote>,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-gray-300">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
          hr: () => <hr className="my-4 border-gray-300" />,
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {textToShow}
      </ReactMarkdown>
      {/* 显示光标效果（仅在AI消息且正在打字时） */}
      {shouldUseTypewriter && isTyping && (
        <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
      )}
    </div>
  );
};