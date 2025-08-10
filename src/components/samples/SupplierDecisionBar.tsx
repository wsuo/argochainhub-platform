import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SupplierDecisionBarProps {
  disabled?: boolean;
  onApprove: (data: { notes?: string; estimatedShipDate?: string }) => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
}

export function SupplierDecisionBar({ disabled, onApprove, onReject }: SupplierDecisionBarProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [content, setContent] = useState("");
  const [estimatedShipDate, setEstimatedShipDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (mode === "reject" && !content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "approve") {
        await onApprove({
          notes: content.trim() || undefined,
          estimatedShipDate: estimatedShipDate ? format(estimatedShipDate, 'yyyy-MM-dd') : undefined
        });
      } else {
        await onReject(content.trim());
      }
      
      // Reset form after success
      setContent("");
      setEstimatedShipDate(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t('samples.supplierDecision.title')}</Label>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as any)}
          disabled={!!disabled}
        >
          <ToggleGroupItem value="approve" aria-label={t('samples.supplierDecision.approve')}>
            {t('samples.supplierDecision.approve')}
          </ToggleGroupItem>
          <ToggleGroupItem value="reject" aria-label={t('samples.supplierDecision.reject')}>
            {t('samples.supplierDecision.reject')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {mode === "approve" && (
        <div className="space-y-2">
          <Label>{t('samples.supplierDecision.estimatedShipDate')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !estimatedShipDate && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {estimatedShipDate 
                  ? format(estimatedShipDate, "yyyy-MM-dd") 
                  : t('samples.supplierDecision.selectDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={estimatedShipDate}
                onSelect={setEstimatedShipDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-2">
        <Label>
          {mode === "approve" 
            ? t('samples.supplierDecision.approveNotes') 
            : t('samples.supplierDecision.rejectReason')}
        </Label>
        <Textarea
          placeholder={
            mode === "approve"
              ? t('samples.supplierDecision.approveNotesPlaceholder')
              : t('samples.supplierDecision.rejectReasonPlaceholder')
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!!disabled}
          className="min-h-[100px]"
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!!disabled || isSubmitting || (mode === "reject" && !content.trim())}
        className="w-full"
      >
        {isSubmitting 
          ? t('common.submitting')
          : mode === "approve" 
            ? t('samples.supplierDecision.submitApprove') 
            : t('samples.supplierDecision.submitReject')}
      </Button>
    </div>
  );
}