import React, { useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface SupplierCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: () => void;
  className?: string;
}

export const SupplierCheckbox: React.FC<SupplierCheckboxProps> = ({
  checked,
  indeterminate,
  onCheckedChange,
  className
}) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      (checkboxRef.current as any).indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <Checkbox
      ref={checkboxRef}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={className}
    />
  );
};