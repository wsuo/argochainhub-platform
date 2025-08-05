import { useState } from 'react';
import { Play, CheckCircle, Circle, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { WorkflowStatus } from '@/services/aiSearchService';
import { Button } from '@/components/ui/button';

interface WorkflowProgressProps {
  status: WorkflowStatus;
  className?: string;
}

export const WorkflowProgress = ({ status, className = '' }: WorkflowProgressProps) => {
  const [showHistory, setShowHistory] = useState(false);
  
  if (!status.isRunning && status.completedNodes.length === 0) {
    return null;
  }

  const isExecuting = status.isRunning;
  const isCompleted = !status.isRunning && status.completedNodes.length > 0;

  return (
    <div className={`bg-gradient-to-r ${
      isExecuting 
        ? 'from-blue-50 to-indigo-50 border-blue-200' 
        : 'from-green-50 to-emerald-50 border-green-200'
    } border rounded-lg p-3 ${className}`}>
      {/* 工作流状态头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">AI工作流执行中</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">执行完成</span>
            </>
          )}
        </div>
        
        {/* 折叠/展开按钮 - 仅在有历史记录时显示 */}
        {status.completedNodes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            {showHistory ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* 当前执行节点 */}
      {status.currentNode && isExecuting && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <Play className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-700">
              正在执行: <span className="font-medium">{status.currentNode.title}</span>
            </span>
          </div>
        </div>
      )}

      {/* 历史流程 - 可折叠 */}
      {status.completedNodes.length > 0 && (
        <div className={`mt-2 ${showHistory ? 'block' : 'hidden'}`}>
          <div className="flex items-center space-x-1 mb-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">执行历史 ({status.completedNodes.length}个步骤):</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {status.completedNodes.map((node, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate">
                  {node.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 执行完成但未展开历史时显示简化信息 */}
      {isCompleted && !showHistory && (
        <div className="mt-2">
          <div className="text-xs text-green-700">
            工作流已完成 • {status.completedNodes.length}个步骤
          </div>
        </div>
      )}
    </div>
  );
};