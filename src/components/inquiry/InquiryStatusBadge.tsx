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
    switch (status) {
      case 'pending_quote': return 'outline';
      case 'quoted': return 'default';
      case 'confirmed': return 'secondary';
      case 'declined': return 'destructive';
      case 'expired': return 'secondary';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'pending_quote': return 'border-orange-500 text-orange-600';
      case 'quoted': return 'border-blue-500 text-blue-600';
      case 'confirmed': return 'border-green-500 text-green-600';
      case 'declined': return 'border-red-500 text-red-600';
      case 'expired': return 'border-gray-500 text-gray-600';
      case 'cancelled': return 'border-gray-500 text-gray-600';
      default: return '';
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