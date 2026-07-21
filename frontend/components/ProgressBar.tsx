interface ProgressBarProps {
  progress: number; // 0 to 100
}

export function ProgressBar({ progress }: ProgressBarProps) {
  // Ensure progress is within 0-100 bounds
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="flex flex-col gap-1 w-full min-w-[100px]">
      <span className="font-mono-kpi font-medium text-[12.5px] select-none">
        {clampedProgress}%
      </span>
      <div className="w-full h-[5px] bg-[#EDF1F2] dark:bg-[#233A52] rounded-[4px] overflow-hidden">
        <div
          className="h-full bg-teal rounded-[4px] transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
