import { useState, useEffect, useRef } from 'react';

interface UseTypewriterEffectOptions {
  speed?: number; // 打字速度（毫秒）
  onComplete?: () => void;
}

export const useTypewriterEffect = (
  text: string,
  options: UseTypewriterEffectOptions = {}
) => {
  const { speed = 30, onComplete } = options;
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
      return;
    }

    // 如果文本没有变化，不处理
    if (text === textRef.current) {
      console.log('📝 文本未变化，跳过处理');
      return;
    }
    
    console.log('📝 打字机接收新文本:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    console.log('📝 当前显示文本:', displayedText.substring(0, 50) + (displayedText.length > 50 ? '...' : ''));

    // 如果新文本比已显示的短，直接设置
    if (text.length < displayedText.length) {
      console.log('📝 新文本更短，直接设置');
      setDisplayedText(text);
      setIsTyping(false);
      textRef.current = text;
      displayedTextRef.current = text;
      return;
    }

    // 更新目标文本
    textRef.current = text;

    // 判断是否需要启动或继续打字动画
    const shouldStartTyping = (
      displayedText.length === 0 || // 没有显示任何内容
      !text.startsWith(displayedText) || // 新文本不是延续
      (text.startsWith(displayedText) && text.length > displayedText.length) // 新文本是延续且更长
    );

    if (shouldStartTyping) {
      console.log('📝 开始新的打字动画，当前索引:', displayedText.length);
      setIsTyping(true);
      
      // 清除之前的定时器
      if (intervalRef.current) {
        console.log('📝 清除之前的定时器');
        clearInterval(intervalRef.current);
      }

      let currentIndex = displayedText.length;
      console.log('📝 定时器开始，初始索引:', currentIndex, '目标长度:', text.length);

      intervalRef.current = setInterval(() => {
        console.log('⏰ 定时器执行 - 当前索引:', currentIndex, '目标长度:', textRef.current.length);
        
        if (currentIndex >= textRef.current.length) {
          console.log('✅ 打字完成');
          setIsTyping(false);
          onComplete?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        currentIndex++;
        const newDisplayText = textRef.current.slice(0, currentIndex);
        console.log('⏰ 更新显示文本 - 索引:', currentIndex, '字符:', newDisplayText.charAt(currentIndex - 1), '总长度:', newDisplayText.length);
        setDisplayedText(newDisplayText);
        displayedTextRef.current = newDisplayText;
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        console.log('🧹 清理定时器');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, onComplete]);

  const reset = () => {
    setDisplayedText('');
    setIsTyping(false);
    textRef.current = '';
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