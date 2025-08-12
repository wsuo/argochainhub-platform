import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { RegistrationStatus } from '@/types/registration';
import { cn } from '@/lib/utils';

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus;
  className?: string;
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const { t } = useTranslation();

  const getStatusConfig = (status: RegistrationStatus) => {
    switch (status) {
      case 'pending_response':
        return {
          label: t('registration.status.pending_response', '待回复'),
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
      case 'in_progress':
        return {
          label: t('registration.status.in_progress', '进行中'),
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        };
      case 'completed':
        return {
          label: t('registration.status.completed', '已完成'),
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'declined':
        return {
          label: t('registration.status.declined', '已拒绝'),
          variant: 'default' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        };
      case 'cancelled':
        return {
          label: t('registration.status.cancelled', '已取消'),
          variant: 'default' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        };
      default:
        return {
          label: status,
          variant: 'default' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};