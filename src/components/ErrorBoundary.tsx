import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, copied: false });
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    
    const errorDetails = [
      '=== 错误详情 ===',
      `时间: ${new Date().toLocaleString()}`,
      `页面: ${window.location.href}`,
      `用户代理: ${navigator.userAgent}`,
      '',
      '=== 错误信息 ===',
      `错误类型: ${error?.name || '未知错误'}`,
      `错误消息: ${error?.message || '无错误消息'}`,
      '',
      '=== 错误堆栈 ===',
      error?.stack || '无堆栈信息',
      '',
      '=== 组件堆栈 ===',
      errorInfo?.componentStack || '无组件堆栈信息'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      
      // 3秒后重置复制状态
      setTimeout(() => {
        this.setState({ copied: false });
      }, 3000);
    } catch (err) {
      console.error('复制失败:', err);
      // 如果复制失败，创建一个临时文本区域来复制
      const textArea = document.createElement('textarea');
      textArea.value = errorDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.setState({ copied: true });
      setTimeout(() => {
        this.setState({ copied: false });
      }, 3000);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 m-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">页面出现错误</div>
                  <div className="text-sm opacity-90 mb-3">
                    {this.state.error?.message || '未知错误，请尝试刷新页面'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleCopyError}
                  className="text-xs"
                  disabled={this.state.copied}
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      复制错误信息
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleReset}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  重试
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}