"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  fetchAtividades,
  extractCoordenadorias,
  fetchCoordenadorias,
  createCoordenadoria,
  updateCoordenadoria,
  deleteCoordenadoria,
  Atividade,
  ApiCoordenadoria,
  cleanCoordenadoriaName,
  isCombinedSector,
} from "@/lib/api";
import {
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Mail,
  Trash2,
  Edit3,
  Loader2,
} from "lucide-react";

export default function CoordenadoriasPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [coordenadoriasDb, setCoordenadoriasDb] = useState<ApiCoordenadoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedCoord, setSelectedCoord] = useState<{ id: string | null; name: string; emails: string[] } | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmails, setFormEmails] = useState<string[]>([""]);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [actData, dbData] = await Promise.all([
        fetchAtividades(),
        fetchCoordenadorias(),
      ]);
      setAtividades(actData);
      setCoordenadoriasDb(dbData);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar responsÃ¡veis";
      setError(msg);
      setAtividades([]);
      setCoordenadoriasDb([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique coordinators from excel sheet activities
  const atividadesCoords = useMemo(
    () => extractCoordenadorias(atividades),
    [atividades]
  );

  // Get coordination names from database
  const dbCoordNames = useMemo(
    () => coordenadoriasDb.map((c) => cleanCoordenadoriaName(c.name)).filter((name) => !isCombinedSector(name)),
    [coordenadoriasDb]
  );

  // Merged unique coordination names list
  const mergedCoordNames = useMemo(() => {
    const names = new Set([...atividadesCoords, ...dbCoordNames]);
    return Array.from(names).sort();
  }, [atividadesCoords, dbCoordNames]);

  // Combine DB data and excel stats
  const coordData = useMemo(() => {
    return mergedCoordNames.map((name) => {
      const dbCoord = coordenadoriasDb.find((c) => cleanCoordenadoriaName(c.name) === name);
      const emails = dbCoord ? dbCoord.emails : [];
      const dbId = dbCoord ? dbCoord.id : null;

      const itens = atividades.filter((d) => d.coordenadoria === name);
      const total = itens.length;
      const done = itens.filter((d) => d.status === "ok").length;
      const progress = itens.filter((d) => d.status === "warn").length;
      const late = itens.filter((d) => d.status === "late").length;
      const percent = total ? Math.round((done / total) * 100) : 0;

      return {
        id: dbId,
        name,
        emails,
        total,
        done,
        progress,
        late,
        percent,
      };
    });
  }, [mergedCoordNames, coordenadoriasDb, atividades]);

  // Drawer handlers
  const handleOpenCreate = () => {
    setDrawerMode("create");
    setSelectedCoord(null);
    setFormName("");
    setFormEmails([""]);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (coord: { id: string | null; name: string; emails: string[] }) => {
    setDrawerMode("edit");
    setSelectedCoord(coord);
    setFormName(coord.name);
    setFormEmails(coord.emails.length > 0 ? [...coord.emails] : [""]);
    setIsDrawerOpen(true);
  };

  const handleAddEmailInput = () => {
    setFormEmails([...formEmails, ""]);
  };

  const handleRemoveEmailInput = (index: number) => {
    setFormEmails(formEmails.filter((_, idx) => idx !== index));
  };

  const handleEmailInputChange = (index: number, value: string) => {
    const updated = [...formEmails];
    updated[index] = value;
    setFormEmails(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const cleanEmails = formEmails.map((email) => email.trim()).filter((email) => email !== "");

    try {
      if (drawerMode === "create") {
        await createCoordenadoria({
          name: formName.trim(),
          emails: cleanEmails,
        });
      } else if (drawerMode === "edit" && selectedCoord) {
        if (selectedCoord.id) {
          await updateCoordenadoria(selectedCoord.id, {
            emails: cleanEmails,
          });
        } else {
          // If parsed from sheet but not in DB yet, create it on edit save
          await createCoordenadoria({
            name: formName.trim(),
            emails: cleanEmails,
          });
        }
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar responsÃ¡vel");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCoord || !selectedCoord.id) return;
    if (!confirm("Tem certeza que deseja excluir este responsÃ¡vel?")) return;

    setIsSaving(true);
    try {
      await deleteCoordenadoria(selectedCoord.id);
      setIsDrawerOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir responsÃ¡vel");
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !loading && !isDrawerOpen) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-[14px] text-ink-soft text-center max-w-md">
          Não foi possível carregar os responsáveis.
          <br />
          <span className="text-[12px] text-ink-soft/70">{error}</span>
        </p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="font-display font-bold text-[18px] text-ink">
            Configuração de Responsáveis e Alertas
          </h2>
          <p className="text-[12px] text-ink-soft mt-0.5">
            Cadastre os e-mails de alerta oficiais de cada responsável para notificações automáticas de prazos.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 font-sans text-[12.5px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Responsável
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-[14px] max-xl:grid-cols-2 max-sm:grid-cols-1">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-panel border border-line/30 rounded-custom p-6 animate-pulse"
            >
              <div className="h-4 w-32 bg-line/30 rounded mb-4" />
              <div className="flex flex-col gap-3">
                <div className="h-3 w-full bg-line/20 rounded" />
                <div className="h-3 w-full bg-line/20 rounded" />
                <div className="h-3 w-full bg-line/20 rounded" />
                <div className="h-3 w-full bg-line/20 rounded" />
                <div className="h-3 w-24 bg-line/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : coordData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-[14px] text-ink-soft text-center">
            Nenhum responsável encontrado.
          </p>
          <p className="text-[12px] text-ink-soft/70 text-center">
            Importe uma planilha ou cadastre um responsável manualmente para começar a ver os dados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {coordData.map((data, idx) => (
            <div
              key={idx}
              className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <Link
                    href={`/atividades?coordenadoria=${encodeURIComponent(data.name)}`}
                    className="font-display font-semibold text-[14.5px] text-ink hover:text-teal hover:underline transition-colors"
                  >
                    {data.name}
                  </Link>
                  <button
                    onClick={() => handleOpenEdit({ id: data.id, name: data.name, emails: data.emails })}
                    className="text-ink-soft hover:text-teal cursor-pointer p-1 rounded hover:bg-line/30 transition-colors"
                    title="Editar responsável e e-mails"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Emails section */}
                {data.emails && data.emails.length > 0 ? (
                  <div className="flex flex-col gap-1 my-3 bg-line/10 p-2.5 rounded-lg border border-line/25">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2px] text-ink-soft select-none flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-teal" /> E-mails de Notificação
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.emails.map((email, eIdx) => (
                        <span
                          key={eIdx}
                          className="text-[11px] font-mono font-medium text-ink bg-panel border border-line px-1.5 py-0.5 rounded select-all break-all"
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="my-3 text-[11px] italic text-rose-500/80 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30 flex items-center gap-1.5 select-none">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Sem e-mails de contato configurados.
                  </div>
                )}
              </div>

              {/* Statistics details */}
              <div className="flex flex-col gap-2 border-t border-line/30 pt-3 mt-2">
                <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
                  <span>Atividades ativas</span>
                  <b className="font-mono-kpi text-ink font-semibold">{data.total}</b>
                </div>
                <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
                  <span>Concluídas</span>
                  <b className="font-mono-kpi text-ink font-semibold text-emerald-600 dark:text-emerald-400">
                    {data.done}
                  </b>
                </div>
                <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
                  <span>Em andamento</span>
                  <b className="font-mono-kpi text-ink font-semibold text-amber-600 dark:text-amber-400">
                    {data.progress}
                  </b>
                </div>
                <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
                  <span>Atrasadas</span>
                  <b className="font-mono-kpi text-ink font-semibold text-rose-600 dark:text-rose-400">
                    {data.late}
                  </b>
                </div>
                <div className="flex justify-between items-center text-[12.5px] text-ink-soft border-t border-line/50 pt-2 mt-1">
                  <span>% concluído</span>
                  <b className="font-mono-kpi text-ink font-semibold text-teal">
                    {data.percent}%
                  </b>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Right Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-100 flex justify-end animate-[fadeIn_0.15s_ease-out]">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-[#000]/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative bg-panel border-l border-line w-full max-w-md h-full shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-line">
              <h3 className="font-display font-bold text-[16px] text-ink">
                {drawerMode === "create" ? "Novo Responsável" : "Editar Responsável"}
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-ink-soft hover:text-ink cursor-pointer p-1 rounded hover:bg-line/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-6 overflow-y-auto flex flex-col gap-5">
                {error && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 p-3 rounded-lg text-[12.5px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Nome */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-semibold text-[12.5px] text-ink">
                    Nome do Responsável / Setor
                  </label>
                  <input
                    type="text"
                    required
                    disabled={drawerMode === "edit"}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: CTI, GGCOR, DTR"
                    className="font-sans text-[13px] py-2 px-3 rounded-lg border border-line bg-panel text-ink outline-none focus:border-teal transition-colors w-full disabled:bg-line/10 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                  <p className="text-[11px] text-ink-soft">
                    O nome deve corresponder exatamente ao setor preenchido nas planilhas de atividades para o correto mapeamento.
                  </p>
                </div>

                {/* Emails List */}
                <div className="flex flex-col gap-2.5">
                  <label className="font-sans font-semibold text-[12.5px] text-ink flex items-center justify-between">
                    <span>E-mails de Alerta</span>
                    <button
                      type="button"
                      onClick={handleAddEmailInput}
                      className="text-teal hover:underline text-[12px] font-semibold cursor-pointer border-none bg-transparent"
                    >
                      + Adicionar E-mail
                    </button>
                  </label>

                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {formEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2 animate-[fadeIn_0.1s_ease-out]">
                        <div className="relative flex-1">
                          <Mail className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => handleEmailInputChange(index, e.target.value)}
                            placeholder="Ex: responsavel@arpe.pe.gov.br"
                            className="font-sans text-[13px] py-2 pl-9 pr-3 rounded-lg border border-line bg-panel text-ink outline-none focus:border-teal transition-colors w-full"
                          />
                        </div>
                        {formEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmailInput(index)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-2 rounded-lg cursor-pointer transition-colors border border-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    Cadastre os e-mails oficiais que receberão notificações diárias de prazos para as atividades associadas a este setor.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-line bg-line/5 flex justify-between items-center select-none">
                {drawerMode === "edit" && selectedCoord?.id ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 font-sans text-[12.5px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg py-2 px-3 border border-transparent transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="font-sans text-[12.5px] font-semibold text-ink-soft hover:text-ink rounded-lg py-2 px-4 bg-transparent cursor-pointer border-none transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 font-sans text-[12.5px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

