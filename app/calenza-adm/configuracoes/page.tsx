"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import { Loader2, Save, RotateCcw, Bot, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfigEntry {
  value: string;
  label: string;
  updatedAt: string | null;
}

interface Configs {
  rh_ia_system_prompt: ConfigEntry;
}

const DEFAULT_PROMPT = `Você é um especialista em direito trabalhista brasileiro e gestão de RH para pequenas e médias empresas do setor de alimentação (CNAE 5611-2/01 — Restaurantes e similares).

Responda SEMPRE com base na legislação vigente atual, citando:
- Artigos da CLT
- Portarias do Ministério do Trabalho e Emprego (MTE)
- Tabelas de INSS, IRRF e FGTS com suas datas de vigência
- Reforma Trabalhista (Lei 13.467/2017) quando relevante

Quando mencionar alíquotas, valores ou datas de vigência, busque sempre os dados mais recentes disponíveis e informe explicitamente a data de vigência.

Formate as respostas de forma clara:
- Use valores em Reais (R$) com formatação brasileira
- Use percentuais precisos
- Cite sempre a fonte legal (lei, portaria, resolução)
- Organize respostas longas com tópicos ou tabelas
- Mencione sempre se alguma informação pode ter sido atualizada recentemente`;

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [configs, setConfigs] = useState<Configs | null>(null);
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/calenza-adm/me");
      if (res.ok) {
        const data = await res.json();
        if (data.role !== "super_admin") {
          router.push("/calenza-adm");
          return;
        }
        setSession(data);
      } else {
        router.push("/calenza-adm/login");
      }
    } catch {
      router.push("/calenza-adm/login");
    }
  }, [router]);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/calenza-adm/configuracoes");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
        setPrompt(data.configs.rh_ia_system_prompt.value);
        setOriginalPrompt(data.configs.rh_ia_system_prompt.value);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (session) loadConfigs();
  }, [session, loadConfigs]);

  async function handleLogout() {
    try {
      await fetch("/api/calenza-adm/logout", { method: "POST" });
    } finally {
      router.push("/calenza-adm/login");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/calenza-adm/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rh_ia_system_prompt: prompt }),
      });
      if (res.ok) {
        setOriginalPrompt(prompt);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Atualizar updatedAt
        setConfigs((prev) =>
          prev
            ? {
                ...prev,
                rh_ia_system_prompt: {
                  ...prev.rh_ia_system_prompt,
                  value: prompt,
                  updatedAt: new Date().toISOString(),
                },
              }
            : prev,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPrompt(DEFAULT_PROMPT);
  }

  function handleDiscard() {
    setPrompt(originalPrompt);
  }

  const isDirty = prompt !== originalPrompt;
  const charCount = prompt.length;

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar session={session} onLogout={handleLogout} loading={false} />

      <main className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">Configurações do Sistema</h1>
            <p className="text-gray-400 text-sm">Personalize o comportamento das IAs da plataforma</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Card do prompt */}
              <div className="bg-[#111113] border border-[#2a2a2e] rounded-xl overflow-hidden">
                {/* Header do card */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">Prompt do Sistema — IA Trabalhista</h2>
                      <p className="text-xs text-gray-500">
                        Módulo RH · Define como a IA responde em todos os chats
                        {configs?.rh_ia_system_prompt.updatedAt && (
                          <> · Salvo em{" "}
                            {(() => {
                              const d = new Date(configs.rh_ia_system_prompt.updatedAt!);
                              const dd = String(d.getUTCDate()).padStart(2, "0");
                              const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
                              const hh = String(d.getUTCHours()).padStart(2, "0");
                              const min = String(d.getUTCMinutes()).padStart(2, "0");
                              return `${dd}/${mm} às ${hh}:${min} UTC`;
                            })()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dica */}
                <div className="mx-6 mt-4 flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Este texto é enviado como instrução inicial para a IA antes de qualquer mensagem do usuário. Use-o para definir o tom, o escopo das respostas, restrições de conteúdo ou informações específicas do seu negócio.
                  </p>
                </div>

                {/* Textarea */}
                <div className="p-6">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={20}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-pink-500/40 resize-y leading-relaxed font-mono"
                    placeholder="Digite o prompt do sistema..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600">{charCount.toLocaleString()} caracteres</span>
                    {isDirty && (
                      <span className="text-xs text-amber-500">● Alterações não salvas</span>
                    )}
                    {saved && !isDirty && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Salvo com sucesso
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer com ações */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a2a2e] bg-[#0d0d0f]">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="border-[#2a2a2e] bg-transparent text-gray-400 hover:text-white hover:bg-[#1c1c1e] gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar padrão
                    </Button>
                    {isDirty && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDiscard}
                        className="text-gray-500 hover:text-white"
                      >
                        Descartar alterações
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    size="sm"
                    className="bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-40 gap-1.5"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {saving ? "Salvando..." : "Salvar prompt"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
