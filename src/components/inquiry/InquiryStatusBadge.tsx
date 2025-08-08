import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { dictionaryService, DictionaryItem } from "@/services/dictionaryService";
import { InquiryStatus } from "@/types/inquiry";

interface InquiryStatusBadgeProps {
  status: InquiryStatus;
  className?: string;
}

export const InquiryStatusBadge = ({ status, className }: InquiryStatusBadgeProps) => {
  const { currentLanguage } = useLanguage();

  // 获取询价状态字典数据
  const { data: statusDict = [] } = useQuery({
    queryKey: ['inquiry-status-dict'],
    queryFn: () => dictionaryService.getInquiryStatuses(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });

  // 获取状态显示文本
  const getStatusLabel = (statusCode: string): string => {
    const statusItem = statusDict.find((item: DictionaryItem) => item.code === statusCode);
    if (!statusItem) return statusCode;

    // 根据当前语言获取对应的显示文本
    const langKey = currentLanguage as keyof typeof statusItem.name;
    return statusItem.name[langKey] || statusItem.name['zh-CN'] || statusCode;
  };

  const getVariant = (status: InquiryStatus) => {
    // 统一使用outline variant避免背景颜色冲突
    return 'outline';
  };

  const getColor = () => {
    switch (status) {
      case 'pending_quote': 
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100';
      case 'quoted': 
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'confirmed': 
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'declined': 
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'expired': 
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case 'cancelled': 
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
      default: 
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <Badge 
      variant={getVariant(status)} 
      className={`${getColor()} ${className}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
};