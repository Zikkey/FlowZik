import { Modal } from './Modal'
import { Button } from './Button'
import { useTranslation } from '@/hooks/use-translation'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = false
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="p-5">
        <h3 className="text-base font-semibold text-content-primary mb-2">{title}</h3>
        <p className="text-sm text-content-secondary mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => { onConfirm(); onClose() }}
            className={danger ? 'bg-red-500/10 hover:bg-red-500/20' : ''}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
