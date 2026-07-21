import { StatusType, statusMap } from "@/lib/api";

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusInfo = statusMap[status];

  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap select-none ${statusInfo.corTailwind}`}
    >
      {statusInfo.label}
    </span>
  );
}
