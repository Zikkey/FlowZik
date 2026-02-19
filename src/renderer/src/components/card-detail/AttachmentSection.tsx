import { useState, useEffect, useCallback } from 'react'
import { Paperclip, X, FileText, Image } from 'lucide-react'
import { useBoardStore } from '@/store'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/utils'
import { createId } from '@/lib/id'
import type { Attachment, Card } from '@/types'

interface AttachmentSectionProps {
  card: Card
  label: string
  addLabel: string
  dropLabel: string
}

export function AttachmentSection({ card, label, addLabel, dropLabel }: AttachmentSectionProps) {
  const { t } = useTranslation()
  const addAttachment = useBoardStore((s) => s.addAttachment)
  const removeAttachment = useBoardStore((s) => s.removeAttachment)
  const updateCard = useBoardStore((s) => s.updateCard)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [isDragOver, setIsDragOver] = useState(false)

  const attachments = card.attachments ?? []

  useEffect(() => {
    let cancelled = false
    for (const att of attachments) {
      if (att.type === 'image' && !thumbnails[att.id]) {
        window.electronAPI.readFileAsDataUrl(att.path).then((dataUrl) => {
          if (!cancelled) setThumbnails((prev) => ({ ...prev, [att.id]: dataUrl }))
        }).catch(() => {})
      }
    }
    return () => { cancelled = true }
  }, [attachments])

  const processFiles = async (paths: string[]) => {
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
    for (const sourcePath of paths) {
      const name = sourcePath.split(/[/\\]/).pop() ?? 'file'
      const ext = name.split('.').pop()?.toLowerCase() ?? ''
      const type = imageExts.includes(ext) ? 'image' as const : 'file' as const
      const destFileName = `${createId()}-${name}`
      const destPath = await window.electronAPI.copyAttachment(sourcePath, destFileName)
      addAttachment(card.id, { name, path: destPath, type, size: 0 })
    }
  }

  const handleAddFiles = async () => {
    const paths = await window.electronAPI.openAttachmentDialog()
    if (!paths?.length) return
    await processFiles(paths)
  }

  const imageExtsSet = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      try {
        const name = file.name
        const ext = name.split('.').pop()?.toLowerCase() ?? ''
        const type = imageExtsSet.has(ext) ? 'image' as const : 'file' as const
        const filePath = (file as any).path as string | undefined
        let destPath: string
        if (filePath) {
          const destFileName = `${createId()}-${name}`
          destPath = await window.electronAPI.copyAttachment(filePath, destFileName)
        } else {
          const buffer = await file.arrayBuffer()
          destPath = await window.electronAPI.saveDroppedFile(name, buffer)
        }
        addAttachment(card.id, { name, path: destPath, type, size: file.size })
      } catch (err) {
        console.error('Failed to add dropped file:', err)
      }
    }
  }, [card.id, addAttachment])

  const handleRemove = async (att: Attachment) => {
    await window.electronAPI.deleteAttachment(att.path)
    removeAttachment(card.id, att.id)
  }

  return (
    <div className="flex items-start gap-3">
      <Paperclip size={18} className="text-content-tertiary mt-1 shrink-0" />
      <div className="flex-1">
        <span className="text-sm font-medium text-content-primary mb-2 block">
          {label} {attachments.length > 0 && `(${attachments.length})`}
        </span>

        {attachments.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {attachments.map((att) => (
              <div key={att.id} className="group relative rounded-lg border border-border overflow-hidden bg-surface-tertiary">
                {att.type === 'image' ? (
                  thumbnails[att.id] ? (
                    <img
                      src={thumbnails[att.id]}
                      alt={att.name}
                      className="w-full h-20 object-cover cursor-pointer"
                      onClick={() => window.electronAPI.openPath(att.path)}
                    />
                  ) : (
                    <div
                      className="w-full h-20 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => window.electronAPI.openPath(att.path)}
                    >
                      <Image size={20} className="text-content-tertiary animate-pulse" />
                      <span className="text-[10px] text-content-tertiary mt-1">{att.name}</span>
                    </div>
                  )
                ) : (
                  <div
                    className="w-full h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-secondary transition-colors"
                    onClick={() => window.electronAPI.openPath(att.path)}
                  >
                    <FileText size={20} className="text-content-tertiary" />
                    <span className="text-[10px] text-content-tertiary mt-1 px-1 truncate max-w-full">
                      {att.name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  {att.type === 'image' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateCard(card.id, {
                          coverImageId: card.coverImageId === att.id ? undefined : att.id
                        })
                      }}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white transition-colors',
                        card.coverImageId === att.id ? 'bg-accent' : 'bg-black/40 hover:bg-accent/80'
                      )}
                    >
                      <Image size={10} />
                      {card.coverImageId === att.id
                        ? t('cardDetail.removeCover' as any)
                        : t('cardDetail.setCover' as any)
                      }
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(att) }}
                    className="p-1 rounded bg-black/40 text-white hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          data-dropzone
          onDragEnter={(e) => { if (!e.dataTransfer.types.includes('Files')) return; e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }}
          onDragOver={(e) => { if (!e.dataTransfer.types.includes('Files')) return; e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true) }}
          onDragLeave={(e) => { e.stopPropagation(); setIsDragOver(false) }}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg px-3 py-4 text-center cursor-pointer transition-colors',
            isDragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-hover'
          )}
          onClick={handleAddFiles}
        >
          <span className="text-xs text-content-tertiary">
            {isDragOver ? dropLabel : addLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
