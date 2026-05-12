import { LectureStatus, STATUS_LABELS } from '@/lib/lectures';

interface Props {
  status: LectureStatus;
}

export default function LectureStatusBadge({ status }: Props) {
  const classMap: Record<LectureStatus, string> = {
    available: 'badge-available',
    preparing: 'badge-preparing',
    locked: 'badge-locked',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${classMap[status]}`}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
