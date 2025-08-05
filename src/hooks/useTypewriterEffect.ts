import { useState, useEffect, useRef } from 'react';

interface UseTypewriterEffectOptions {
  speed?: number; // 打字速度（毫秒）
  onComplete?: () => void;
  chunkSize?: number; // 每次显示的字符数量，用于优化长文本
}

// 智能分块函数 - 按照markdown语义单元分割文本
const getSmartChunks = (text: string, chunkSize: number = 3): string[] => {
  if (!text) return [];

  // 对于短文本，使用字符级别的分割
  if (text.length <= 100) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i++) {
      chunks.push(text.slice(0, i + 1));
    }
    return chunks;
  }

  // 对于长文本，使用智能分块
  const chunks: string[] = [];
  let currentPos = 0;

  // 定义markdown语义边界
  const boundaries = [
    /\n\n/g,           // 段落分隔
    /\n#{1,6}\s/g,     // 标题
    /\n-\s/g,          // 列表项
    /\n\*\s/g,         // 列表项
    /\n\d+\.\s/g,      // 有序列表
    /\*\*[^*]+\*\*/g,  // 粗体
    /`[^`]+`/g,        // 行内代码
    /\n/g,             // 换行
  ];

  // 找到所有语义边界位置
  const boundaryPositions = new Set<number>();
  boundaries.forEach(regex => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      boundaryPositions.add(match.index + match[0].length);
    }
  });

  // 转换为排序数组
  const sortedBoundaries = Array.from(boundaryPositions).sort((a, b) => a - b);

  // 生成分块
  while (currentPos < text.length) {
    // 寻找下一个合适的分割点
    let nextPos = currentPos + chunkSize;

    // 如果超出文本长度，直接到末尾
    if (nextPos >= text.length) {
      chunks.push(text.slice(0, text.length));
      break;
    }

    // 寻找最近的语义边界
    const nearestBoundary = sortedBoundaries.find(pos => pos > currentPos && pos <= nextPos + chunkSize);
    if (nearestBoundary) {
      nextPos = nearestBoundary;
    }

    chunks.push(text.slice(0, nextPos));
    currentPos = nextPos;
  }

  return chunks;
};

export const useTypewriterEffect = (
  text: string,
  options: UseTypewriterEffectOptions = {}
) => {
  const { speed = 8, onComplete, chunkSize = 5 } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef('');
  const displayedTextRef = useRef('');

  useEffect(() => {
    console.log('🔥 打字机useEffect触发 - 传入文本长度:', text.length, '显示文本长度:', displayedText.length, '正在打字:', isTyping);

    // 如果文本为空，重置
    if (!text) {
      console.log('📝 文本为空，重置状态');
      setDisplayedText('');
      setIsTyping(false);
      textRef.current = '';
      displayedTextRef.current = '';
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 如果文本没有变化，不处理
    if (text === textRef.current) {
      console.log('📝 文本未变化，跳过处理');
      return;
    }

    console.log('📝 打字机接收新文本:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    console.log('📝 当前显示文本:', displayedText.substring(0, 50) + (displayedText.length > 50 ? '...' : ''));

    // 更新目标文本
    textRef.current = text;

    // 如果新文本比已显示的短，说明这是新消息的开始
    if (text.length < displayedText.length) {
      console.log('📝 新文本更短，这是新消息开始，重置状态');
      setDisplayedText('');
      displayedTextRef.current = '';
      setIsTyping(text.length > 0);

      // 清除之前的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // 如果新文本为空，直接返回
      if (text.length === 0) {
        return;
      }
    }

    // 如果新文本不是当前显示文本的延续，重新开始
    if (displayedText.length > 0 && !text.startsWith(displayedText)) {
      console.log('📝 新文本不是延续，重新开始');
      setDisplayedText('');
      displayedTextRef.current = '';
      setIsTyping(true);

      // 清除之前的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // 如果新文本是延续且更长，或者需要重新开始
    if (text.length > displayedText.length) {
      console.log('📝 开始/继续打字动画，当前显示长度:', displayedText.length, '目标长度:', text.length);
      setIsTyping(true);

      // 清除之前的定时器
      if (intervalRef.current) {
        console.log('📝 清除之前的定时器');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // 生成智能分块，但只生成从当前位置到结尾的部分
      const remainingText = text.slice(displayedText.length);
      const fullChunks = getSmartChunks(text, chunkSize);

      // 找到当前显示位置对应的分块索引
      let currentChunkIndex = 0;
      for (let i = 0; i < fullChunks.length; i++) {
        if (fullChunks[i].length > displayedText.length) {
          currentChunkIndex = i;
          break;
        }
      }

      console.log('📝 智能分块生成完成，总块数:', fullChunks.length, '当前块索引:', currentChunkIndex);

      let chunkIndex = currentChunkIndex;
      intervalRef.current = setInterval(() => {
        console.log('⏰ 定时器执行 - 当前块索引:', chunkIndex, '总块数:', fullChunks.length);

        // 检查是否完成
        if (chunkIndex >= fullChunks.length) {
          console.log('✅ 打字完成');
          setIsTyping(false);
          onComplete?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // 检查目标文本是否发生变化
        if (textRef.current !== text) {
          console.log('📝 目标文本已变化，停止当前动画');
          return;
        }

        const newDisplayText = fullChunks[chunkIndex];
        console.log('⏰ 更新显示文本 - 块索引:', chunkIndex, '文本长度:', newDisplayText.length);
        setDisplayedText(newDisplayText);
        displayedTextRef.current = newDisplayText;
        chunkIndex++;
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        console.log('🧹 清理定时器');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, chunkSize, onComplete]);

  const reset = () => {
    setDisplayedText('');
    setIsTyping(false);
    textRef.current = '';
    displayedTextRef.current = '';
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    displayedText,
    isTyping,
    reset
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};