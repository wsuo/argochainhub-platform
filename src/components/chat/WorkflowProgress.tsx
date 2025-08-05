import { Play, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { WorkflowStatus } from '@/services/aiSearchService';

interface WorkflowProgressProps {
  status: WorkflowStatus;
  className?: string;
}

export const WorkflowProgress = ({ status, className = '' }: WorkflowProgressProps) => {
  if (!status.isRunning && status.completedNodes.length === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      {/* 工作流状态头部 */}
      <div className="flex items-center space-x-2 mb-2">
        {status.isRunning ? (
          <>
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-800">AI工作流执行中</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">工作流执行完成</span>
          </>
        )}
      </div>

      {/* 当前执行节点 */}
      {status.currentNode && (
        <div className="mb-2">
          <div className="flex items-center space-x-2">
            <Play className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-blue-700">
              正在执行: <span className="font-medium">{status.currentNode.title}</span>
            </span>
          </div>
        </div>
      )}

      {/* 已完成的节点 */}
      {status.completedNodes.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600 mb-1">执行历史:</div>
          <div className="space-y-1 max-h-16 overflow-y-auto">
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
    </div>
  );
};