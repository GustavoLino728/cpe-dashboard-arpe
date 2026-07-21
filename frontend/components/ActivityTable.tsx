import { Atividade } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";

interface ActivityTableProps {
  activities: Atividade[];
}

export function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 overflow-x-auto w-full">
      <table className="w-full border-collapse text-[12.5px] text-left text-ink min-w-[600px]">
        <thead>
          <tr className="border-b border-line">
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
              Atividade
            </th>
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
              Coordenadoria
            </th>
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
              Responsável
            </th>
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold min-w-[120px]">
              Progresso
            </th>
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
              Prazo
            </th>
            <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {activities.map((d, idx) => (
            <tr
              key={idx}
              className="border-b border-line last:border-0 hover:bg-bg/40 transition-colors"
            >
              <td className="py-3 pr-2 font-medium">{d.atividade}</td>
              <td className="py-3 pr-2">{d.coordenadoria}</td>
              <td className="py-3 pr-2">{d.responsavel}</td>
              <td className="py-3 pr-2">
                <ProgressBar progress={d.progresso} />
              </td>
              <td className="py-3 pr-2 font-mono-kpi">{d.prazo}</td>
              <td className="py-3">
                <StatusBadge status={d.status} />
              </td>
            </tr>
          ))}
          {activities.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="text-center text-ink-soft py-6 font-medium"
              >
                Nenhuma atividade encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
