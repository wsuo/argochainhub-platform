import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthCard } from "./AuthCard";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  title = "登录或注册以继续",
  description = "请登录您的账户以访问此功能"
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* 使用 VisuallyHidden 来满足可访问性要求 */}
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        
        {/* 顶部提示信息 */}
        <div className="p-6 pb-0">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        {/* AuthCard组件，调整样式以适应弹窗 */}
        <div className="px-6 pb-6">
          <div className="bg-transparent border-none shadow-none">
            <AuthCard onSuccess={handleSuccess} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};