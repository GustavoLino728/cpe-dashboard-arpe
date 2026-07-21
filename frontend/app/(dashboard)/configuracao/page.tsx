"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Save, Settings, Bell, HelpCircle } from "lucide-react";
import { fetchAtividades, extractCoordenadorias } from "@/lib/api";

export default function ConfiguracaoPage() {
  const [defaultCoord, setDefaultCoord] = useState("todas");
  const [frequency, setFrequency] = useState("manual");
  const [notifyLate, setNotifyLate] = useState(true);

  // ---- Coordenadorias dinâmicas da API ----
  const [coordenadorias, setCoordenadorias] = useState<string[]>([]);

  const loadCoords = useCallback(async () => {
    try {
      const data = await fetchAtividades();
      setCoordenadorias(extractCoordenadorias(data));
    } catch {
      // Silencioso — selects ficam com "todas" apenas
      setCoordenadorias([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCoords();
  }, [loadCoords]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Persistir as configurações reais do usuário.
    // Exemplo:
    // await fetch('/api/user/settings', {
    //   method: 'POST',
    //   body: JSON.stringify({ defaultCoord, frequency, notifyLate })
    // });
    
    alert(
      "Configurações Salvas (Simulação)!\n\n" +
      "Valores:\n" +
      `- Coordenadoria Padrão: ${defaultCoord === "todas" ? "Todas" : defaultCoord}\n` +
      `- Frequência: ${frequency}\n` +
      `- Notificar atrasos: ${notifyLate ? "Sim" : "Não"}\n\n` +
      "TODO: Integrar persistência no banco de dados."
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-[650px] w-full">
      {/* Título */}
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-ink-soft select-none" />
        <h2 className="font-display font-bold text-[18px] text-ink select-none">
          Configurações do Sistema
        </h2>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleSave}
        className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 flex flex-col gap-6"
      >
        {/* Campo 1: Coordenadoria Padrão */}
        <div className="flex flex-col gap-2">
          <label className="font-sans font-semibold text-[13px] text-ink flex items-center gap-1.5 select-none">
            Coordenadoria padrão ao abrir
            <span
              className="text-ink-soft hover:text-ink cursor-help"
              title="Define qual visão de coordenadoria será exibida inicialmente quando o painel principal for carregado."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </label>
          <select
            value={defaultCoord}
            onChange={(e) => setDefaultCoord(e.target.value)}
            className="font-sans text-[13.5px] py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors w-full"
          >
            <option value="todas">Central — todas as coordenadorias</option>
            {coordenadorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Campo 2: Frequência de Importação */}
        <div className="flex flex-col gap-2">
          <label className="font-sans font-semibold text-[13px] text-ink flex items-center gap-1.5 select-none">
            Frequência de importação recomendada
            <span
              className="text-ink-soft hover:text-ink cursor-help"
              title="Intervalo recomendado para atualização da planilha de dados no painel."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="font-sans text-[13.5px] py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors w-full"
          >
            <option value="manual">Manual (Apenas quando enviado)</option>
            <option value="diario">Diário (A cada 24 horas)</option>
            <option value="semanal">Semanal (A cada 7 dias)</option>
            <option value="mensal">Mensal (A cada 30 dias)</option>
          </select>
        </div>

        {/* Campo 3: Checkbox de Notificações */}
        <div className="border-t border-line/60 pt-4 flex flex-col gap-3">
          <h4 className="font-sans font-semibold text-[13px] text-ink flex items-center gap-2 select-none">
            <Bell className="w-4 h-4 text-teal" /> Notificações e Alertas
          </h4>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyLate}
              onChange={(e) => setNotifyLate(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-line text-teal bg-panel focus:ring-teal outline-none cursor-pointer accent-teal mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-[13px] font-medium text-ink">
                Notificação de prazos expirados
              </span>
              <span className="text-[11.5px] text-ink-soft leading-normal">
                Enviar alerta por e-mail para o coordenador da área sempre que uma
                atividade passar do prazo original (status Atrasado).
              </span>
            </div>
          </label>
        </div>

        {/* Botão de Salvar */}
        <div className="border-t border-line/60 pt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            <Save className="w-4 h-4" /> Salvar configurações
          </button>
        </div>
      </form>
    </div>
  );
}
