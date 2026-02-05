"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CHECKLIST_TOPICS, type EvaluationStatus } from "@/lib/checklist-data";
import { ArrowLeft, Save, ChevronDown, ChevronUp, Camera, X } from "lucide-react";
import { useUser } from "@stackframe/stack";

interface StoreData {
  id: string;
  name: string;
}

export default function NewEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser({ or: 'redirect' });
  const storeIdParam = searchParams.get('storeId');
  
  const [currentStep, setCurrentStep] = useState<'info' | 'checklist' | 'final'>('info');
  const [stores, setStores] = useState<StoreData[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(storeIdParam);
  const [storeName, setStoreName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastOvenMaintenance, setLastOvenMaintenance] = useState('');
  const [lastRefrigeratorMaintenance, setLastRefrigeratorMaintenance] = useState('');
  const [lastPestControl, setLastPestControl] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [evaluations, setEvaluations] = useState<Map<string, Map<string, { status: EvaluationStatus; observations: string; photoUrl?: string }>>>(new Map());
  const [topicObservations, setTopicObservations] = useState<Map<string, string>>(new Map());
  const [maintenanceList, setMaintenanceList] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStoreId && stores.length > 0) {
      const store = stores.find(s => s.id === selectedStoreId);
      if (store) {
        setStoreName(store.name);
      }
    }
  }, [selectedStoreId, stores]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/checklist/stores');
      if (!response.ok) throw new Error("Erro ao carregar lojas");
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const setItemEvaluation = (topicId: string, itemId: string, status: EvaluationStatus, observations: string, photoUrl?: string) => {
    const topicEvals = evaluations.get(topicId) || new Map();
    const currentEval = topicEvals.get(itemId);
    topicEvals.set(itemId, { 
      status, 
      observations, 
      photoUrl: photoUrl !== undefined ? photoUrl : currentEval?.photoUrl 
    });
    const newEvaluations = new Map(evaluations);
    newEvaluations.set(topicId, topicEvals);
    setEvaluations(newEvaluations);
  };

  const handlePhotoUpload = async (topicId: string, itemId: string, file: File) => {
    try {
      // Por enquanto, vamos converter para base64 e armazenar no banco
      // Depois podemos implementar upload para storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const topicEvals = evaluations.get(topicId);
        const currentEval = topicEvals?.get(itemId);
        
        if (currentEval) {
          setItemEvaluation(topicId, itemId, currentEval.status, currentEval.observations, base64String);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    }
  };

  const handlePhotoDelete = (topicId: string, itemId: string) => {
    const topicEvals = evaluations.get(topicId);
    const currentEval = topicEvals?.get(itemId);
    
    if (currentEval) {
      setItemEvaluation(topicId, itemId, currentEval.status, currentEval.observations, undefined);
    }
  };

  const setTopicObservation = (topicId: string, observations: string) => {
    const newObservations = new Map(topicObservations);
    newObservations.set(topicId, observations);
    setTopicObservations(newObservations);
  };

  const calculateScore = () => {
    const topicsData: any[] = [];
    let totalScore = 0;
    let maxTotalScore = 0;

    CHECKLIST_TOPICS.forEach(topic => {
      const items: any[] = [];
      let topicScore = 0;
      let topicMaxScore = 0;

      topic.items.forEach(item => {
        const evaluation = evaluations.get(topic.id)?.get(item.id);
        const maxScore = item.weight;
        let score = 0;

        if (evaluation) {
          if (evaluation.status === 'DE ACORDO') {
            score = maxScore;
          } else if (evaluation.status === 'PARCIAL') {
            score = maxScore / 2;
          }
        }

        items.push({
          itemName: item.name,
          score,
          maxScore,
          status: evaluation?.status || 'FORA DO PADRÃO',
          observations: evaluation?.observations || '',
          photoUrl: evaluation?.photoUrl,
        });

        topicScore += score;
        topicMaxScore += maxScore;
      });

      topicsData.push({
        topicName: topic.name,
        score: topicScore,
        maxScore: topicMaxScore,
        observations: topicObservations.get(topic.id) || '',
        items,
      });

      totalScore += topicScore;
      maxTotalScore += topicMaxScore;
    });

    return { topicsData, totalScore, maxTotalScore };
  };

  const handleStartChecklist = () => {
    if (!storeName || !supervisorName) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    setCurrentStep('checklist');
    setExpandedTopics(new Set([CHECKLIST_TOPICS[0].id]));
  };

  const handleFinishChecklist = () => {
    let allItemsEvaluated = true;
    let unevaluatedItems: string[] = [];
    
    CHECKLIST_TOPICS.forEach(topic => {
      const topicEvals = evaluations.get(topic.id);
      topic.items.forEach(item => {
        if (!topicEvals?.has(item.id)) {
          allItemsEvaluated = false;
          unevaluatedItems.push(`${topic.name} - ${item.name}`);
        }
      });
    });
    
    if (!allItemsEvaluated) {
      alert(`Todos os itens devem ser avaliados antes de finalizar.\n\nItens não avaliados: ${unevaluatedItems.length}\n\nPor favor, marque uma opção para cada item do checklist.`);
      return;
    }
    
    setCurrentStep('final');
  };

  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    const { topicsData, totalScore, maxTotalScore } = calculateScore();
    
    const percentageScore = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    const evaluation = {
      storeId: selectedStoreId || undefined,
      storeName,
      supervisorName,
      evaluationDate,
      topics: topicsData,
      totalScore: percentageScore,
      maxTotalScore,
      maintenanceList,
      improvementSuggestions,
      lastOvenMaintenance: lastOvenMaintenance || undefined,
      lastRefrigeratorMaintenance: lastRefrigeratorMaintenance || undefined,
      lastPestControl: lastPestControl || undefined,
    };

    try {
      const response = await fetch('/api/checklist/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar avaliação');
      }

      const result = await response.json();
      router.push(`/checklist/relatorio/${result.evaluationId}`);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  if (currentStep === 'info') {
    return (
      <div className="min-h-screen bg-black text-white py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            href="/checklist"
            className="flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="bg-[#141415] rounded-2xl shadow-xl p-8 border border-[#374151]">
            <h1 className="text-3xl font-bold text-white mb-6">Nova Avaliação</h1>
            
            <div className="space-y-6">
              {stores.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Selecione a Loja
                  </label>
                  <select
                    value={selectedStoreId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedStoreId(value || null);
                    }}
                    className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                  >
                    <option value="">Selecione uma loja ou digite abaixo</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    setSelectedStoreId(null);
                  }}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                  placeholder="Ex: Platefull Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nome do Supervisor *
                </label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Data da Avaliação *
                </label>
                <input
                  type="date"
                  required
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                />
              </div>

              <div className="border-t border-[#374151] pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Manutenções e Dedetização</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Última Manutenção no Forno
                    </label>
                    <input
                      type="date"
                      value={lastOvenMaintenance}
                      onChange={(e) => setLastOvenMaintenance(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Última Manutenção nas Geladeiras
                    </label>
                    <input
                      type="date"
                      value={lastRefrigeratorMaintenance}
                      onChange={(e) => setLastRefrigeratorMaintenance(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Última Dedetização
                    </label>
                    <input
                      type="date"
                      value={lastPestControl}
                      onChange={(e) => setLastPestControl(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f0f10] border border-[#374151] rounded-xl text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartChecklist}
                className="w-full bg-[#001F05] text-white py-4 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!storeName || !supervisorName}
              >
                Iniciar Checklist
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'checklist') {
    const { totalScore, maxTotalScore } = calculateScore();
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    return (
      <div className="min-h-screen bg-black text-white py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-[#141415] rounded-2xl shadow-xl p-6 mb-6 sticky top-4 z-10 border border-[#374151]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{storeName}</h2>
                <p className="text-gray-400">Supervisor: {supervisorName}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">
                  {totalScore.toFixed(1)} / {maxTotalScore} pontos
                </div>
              </div>
            </div>
            <button
              onClick={handleFinishChecklist}
              className="w-full bg-[#001F05] text-white py-3 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all"
            >
              Finalizar Checklist
            </button>
          </div>

          <div className="space-y-4">
            {CHECKLIST_TOPICS.map((topic) => {
              const isExpanded = expandedTopics.has(topic.id);
              const topicEvals = evaluations.get(topic.id);
              const completedItems = topic.items.filter(item => topicEvals?.has(item.id)).length;

              return (
                <div key={topic.id} className="bg-[#141415] rounded-2xl shadow-lg overflow-hidden border border-[#374151]">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0f0f10] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-white">{topic.name}</span>
                      <span className="text-sm text-gray-400">
                        {completedItems}/{topic.items.length}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4">
                      {topic.items.map((item) => {
                        const evaluation = topicEvals?.get(item.id);
                        const uploadKey = `${topic.id}_${item.id}`;
                        const showPhotoSection = evaluation?.status === 'PARCIAL' || evaluation?.status === 'FORA DO PADRÃO';

                        return (
                          <div key={item.id} className="border-t border-[#374151] pt-4">
                            <div className="font-semibold text-white mb-3">{item.name}</div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {(['DE ACORDO', 'PARCIAL', 'FORA DO PADRÃO'] as EvaluationStatus[]).map(status => (
                                <button
                                  key={status}
                                  onClick={() => setItemEvaluation(topic.id, item.id, status, evaluation?.observations || '')}
                                  className={`py-2 px-4 rounded-lg font-medium transition-all ${
                                    evaluation?.status === status
                                      ? status === 'DE ACORDO'
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : status === 'PARCIAL'
                                        ? 'bg-yellow-600 text-white shadow-lg'
                                        : 'bg-red-600 text-white shadow-lg'
                                      : 'bg-[#0f0f10] text-gray-300 hover:bg-[#374151] border border-[#374151]'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={evaluation?.observations || ''}
                              onChange={(e) => setItemEvaluation(topic.id, item.id, evaluation?.status || 'FORA DO PADRÃO', e.target.value)}
                              placeholder="Observações (obrigatório para PARCIAL)"
                              className="w-full px-4 py-2 rounded-lg bg-[#0f0f10] border border-[#374151] text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none resize-none"
                              rows={2}
                            />
                            
                            {showPhotoSection && (
                              <div className="mt-3">
                                {evaluation?.photoUrl ? (
                                  <div className="relative inline-block">
                                    <img 
                                      src={evaluation.photoUrl} 
                                      alt="Foto do item"
                                      className="w-full max-w-md rounded-lg border border-[#374151]"
                                    />
                                    <button
                                      onClick={() => handlePhotoDelete(topic.id, item.id)}
                                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <input
                                      ref={(el) => {
                                        if (el) fileInputRefs.current.set(uploadKey, el);
                                      }}
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handlePhotoUpload(topic.id, item.id, file);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <button
                                      onClick={() => fileInputRefs.current.get(uploadKey)?.click()}
                                      type="button"
                                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      <Camera className="w-4 h-4" />
                                      Adicionar Foto
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="border-t border-[#374151] pt-4 mt-4">
                        <label className="block font-semibold text-white mb-2">
                          Observações Gerais do Tópico
                        </label>
                        <textarea
                          value={topicObservations.get(topic.id) || ''}
                          onChange={(e) => setTopicObservation(topic.id, e.target.value)}
                          placeholder="Observações gerais sobre este tópico..."
                          className="w-full px-4 py-2 rounded-lg bg-[#0f0f10] border border-[#374151] text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-[#141415] rounded-2xl shadow-xl p-8 border border-[#374151]">
          <h1 className="text-3xl font-bold text-white mb-6">Informações Finais</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Lista de Manutenção
              </label>
              <p className="text-sm text-gray-400 mb-2">
                Junto com o gerente, coordenador de cozinha e responsável pela expedição, liste itens que precisam de manutenção ou reforma
              </p>
              <textarea
                value={maintenanceList}
                onChange={(e) => setMaintenanceList(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0f0f10] border border-[#374151] text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="Ex: Trocar lâmpadas queimadas da área externa, consertar freezer da cozinha..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Sugestões de Melhoria
              </label>
              <p className="text-sm text-gray-400 mb-2">
                Sugestões da equipe para melhorias em qualquer setor da pizzaria
              </p>
              <textarea
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0f0f10] border border-[#374151] text-white focus:ring-2 focus:ring-[#001F05] focus:border-transparent outline-none resize-none"
                rows={4}
                placeholder="Ex: Adicionar mais uma linha de telefone para atendimento, melhorar iluminação do salão..."
              />
            </div>

            <button
              onClick={handleSaveEvaluation}
              disabled={isSaving}
              className="w-full bg-[#001F05] text-white py-4 rounded-xl font-semibold hover:bg-[#001F05]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Salvando...' : 'Salvar e Gerar Relatório'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

