import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTypewriterEffect } from '@/hooks/useTypewriterEffect';

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  sender: 'user' | 'ai';
}

export const MessageContent = ({ content, isStreaming, sender }: MessageContentProps) => {
  // 只有AI消息且有内容时使用打字机效果
  const shouldUseTypewriter = sender === 'ai' && content.length > 0;
  
  console.log('📋 MessageContent 渲染 - sender:', sender, 'content长度:', content.length, 'isStreaming:', isStreaming, 'shouldUseTypewriter:', shouldUseTypewriter);
  
  const { displayedText, isTyping } = useTypewriterEffect(
    shouldUseTypewriter ? content : '', 
    {
      speed: 25, // 打字速度，越小越快
    }
  );

  console.log('📋 打字机状态 - displayedText长度:', displayedText.length, 'isTyping:', isTyping);
  
  // 当不使用打字机效果时显示原文，使用打字机效果时显示逐步显示的文本
  const textToShow = shouldUseTypewriter ? displayedText : content;
  console.log('📋 最终显示文本长度:', textToShow.length);

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
    <div className="ai-message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 简化组件映射，主要依赖CSS样式
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h4>{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => <code>{children}</code>,
          pre: ({ children }) => <pre>{children}</pre>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          hr: () => <hr />,
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
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