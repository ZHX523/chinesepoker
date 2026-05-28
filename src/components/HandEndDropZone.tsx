import { resolveReorderDraggedId } from '../constants/drag';
import { isReorderDrag } from '../constants/dragSession';

interface HandEndDropZoneProps {
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  onDrop: (draggedId: string) => void;
}

export function HandEndDropZone({
  active,
  onHover,
  onLeave,
  onDrop,
}: HandEndDropZoneProps) {
  return (
    <div
      className={[
        'ml-1 flex h-28 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition-colors sm:h-32',
        active
          ? 'border-amber-400/80 bg-amber-500/10'
          : 'border-transparent',
      ].join(' ')}
      onDragOver={(e) => {
        if (!isReorderDrag()) return;
        e.preventDefault();
        e.stopPropagation();
        onHover();
      }}
      onDragLeave={onLeave}
      onDrop={(e) => {
        if (!isReorderDrag()) return;
        e.preventDefault();
        e.stopPropagation();
        const draggedId = resolveReorderDraggedId(e.dataTransfer);
        if (draggedId) onDrop(draggedId);
      }}
      aria-hidden={!active}
    />
  );
}
