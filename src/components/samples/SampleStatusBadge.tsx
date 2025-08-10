import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { SampleRequestStatus } from "@/types/sample";
import { cn } from "@/lib/utils";

interface SampleStatusBadgeProps {
  status: SampleRequestStatus;
  className?: string;
}

export function SampleStatusBadge({ status, className }: SampleStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusConfig = (status: SampleRequestStatus) => {
    switch (status) {
      case SampleRequestStatus.PENDING_APPROVAL:
        return {
          label: t('samples.status.pendingApproval'),
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
        };
      case SampleRequestStatus.APPROVED:
        return {
          label: t('samples.status.approved'),
          className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
        };
      case SampleRequestStatus.SHIPPED:
        return {
          label: t('samples.status.shipped'),
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
        };
      case SampleRequestStatus.DELIVERED:
        return {
          label: t('samples.status.delivered'),
          className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
        };
      case SampleRequestStatus.REJECTED:
        return {
          label: t('samples.status.rejected'),
          className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        };
      case SampleRequestStatus.CANCELLED:
        return {
          label: t('samples.status.cancelled'),
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={cn(config.className, className)}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
}