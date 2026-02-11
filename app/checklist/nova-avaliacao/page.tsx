"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CHECKLIST_TOPICS, type EvaluationStatus } from "@/lib/checklist-data";
import { ArrowLeft, Save, ChevronDown, ChevronUp, Camera, X } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { startTokenRefresh, stopTokenRefresh } from "@/lib/refresh-token";

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
  const [evaluations, setEvaluations] = useState<Map<string, Map<string, { status: EvaluationStatus; observations: string; photoUrls?: string[] }>>>(new Map());
  const [topicObservations, setTopicObservations] = useState<Map<string, string>>(new Map());
  const [maintenanceList, setMaintenanceList] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (user) {
      fetchStores();
      checkForDraft();
      
      // 🔄 Iniciar refresh automático do token a cada 60 minutos
      startTokenRefresh(60);
      console.log('🔄 Token refresh ativado para sessões longas (checklist)');

      // Limpar ao desmontar componente
      return () => {
        stopTokenRefresh();
      };
    }
  }, [user]);

  const checkForDraft = async () => {
    try {
      console.log('🔍 Verificando rascunhos no servidor...');
      
      const response = await fetch('/api/checklist/drafts');
      
      if (!response.ok) {
        console.warn('⚠️ Erro ao buscar rascunhos, tentando localStorage...');
        checkForBackupLocalStorage();
        return;
      }
      
      const drafts = await response.json();
      
      if (!drafts || drafts.length === 0) {
        console.log('❌ Nenhum rascunho encontrado no servidor');
        // Tentar localStorage como fallback
        checkForBackupLocalStorage();
        return;
      }
      
      // Pegar o rascunho mais recente
      const draft = drafts[0];
      
      console.log('📦 Rascunho encontrado!', {
        id: draft.id,
        itens: draft.totalItems,
        fotos: draft.totalPhotos,
        comentarios: draft.totalComments,
        lastSaved: draft.lastSaved
      });
      
      const confirmar = confirm(
        '💾 Encontramos um checklist não finalizado!\n\n' +
        `🏪 Loja: ${draft.storeName}\n` +
        `👤 Supervisor: ${draft.supervisorName}\n` +
        `📋 ${draft.totalItems} itens marcados\n` +
        `📸 ${draft.totalPhotos} fotos\n` +
        `💬 ${draft.totalComments} comentários\n` +
        `⏰ Última atualização: ${new Date(draft.lastSaved).toLocaleString('pt-BR')}\n\n` +
        'Deseja recuperar?'
      );
      
      if (confirmar) {
        console.log('✅ Usuário confirmou recuperação');
        
        // Buscar dados completos do rascunho
        const detailResponse = await fetch(`/api/checklist/drafts/${draft.id}`);
        
        if (!detailResponse.ok) {
          throw new Error('Erro ao carregar rascunho completo');
        }
        
        const fullDraft = await detailResponse.json();
        const evaluation = fullDraft.checklistData;
        
        // Restaurar dados
        setCurrentDraftId(draft.id);
        restoreFromDraft(evaluation);
      } else {
        console.log('❌ Usuário cancelou recuperação');
        // Perguntar se quer deletar o rascunho
        const deletar = confirm('Deseja remover este rascunho?');
        if (deletar) {
          await fetch(`/api/checklist/drafts/${draft.id}`, { method: 'DELETE' });
          console.log('🗑️ Rascunho removido');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar rascunhos:', error);
      // Fallback para localStorage
      checkForBackupLocalStorage();
    }
  };

  const restoreFromDraft = (evaluation: any) => {
    console.log('📝 Restaurando dados do rascunho...');
    
    // Restaurar dados básicos
    setSelectedStoreId(evaluation.storeId || null);
    setStoreName(evaluation.storeName);
    setSupervisorName(evaluation.supervisorName);
    setEvaluationDate(evaluation.evaluationDate);
    setLastOvenMaintenance(evaluation.lastOvenMaintenance || '');
    setLastRefrigeratorMaintenance(evaluation.lastRefrigeratorMaintenance || '');
    setLastPestControl(evaluation.lastPestControl || '');
    setMaintenanceList(evaluation.maintenanceList || '');
    setImprovementSuggestions(evaluation.improvementSuggestions || '');
    
    // Restaurar avaliações
    setTimeout(() => {
      const restoredEvaluations = new Map();
      const restoredTopicObservations = new Map();
      let itemsRestaurados = 0;
      let fotosRestauradas = 0;
      let comentariosRestaurados = 0;
      
      if (evaluation.topics && Array.isArray(evaluation.topics)) {
        evaluation.topics.forEach((topic: any) => {
          let topicDefinition = CHECKLIST_TOPICS.find(t => t.id === topic.topicId || t.name === topic.topicName);
          
          if (topicDefinition) {
            const topicEvals = new Map();
            
            if (topic.items && Array.isArray(topic.items)) {
              topic.items.forEach((item: any) => {
                // Só restaurar itens que foram realmente avaliados
                if (item.status === 'FORA DO PADRÃO' && !item.observations && (!item.photoUrls || item.photoUrls.length === 0)) {
                  return; // Pular itens não avaliados
                }
                
                let itemDefinition = topicDefinition!.items.find(i => i.id === item.itemId || i.name === item.itemName);
                
                if (itemDefinition) {
                  const hasPhotos = item.photoUrls && item.photoUrls.length > 0;
                  const hasObservations = item.observations && item.observations.trim() !== '';
                  
                  topicEvals.set(itemDefinition.id, {
                    status: item.status,
                    observations: item.observations || '',
                    photoUrls: item.photoUrls || [],
                  });
                  
                  itemsRestaurados++;
                  if (hasPhotos) fotosRestauradas += item.photoUrls.length;
                  if (hasObservations) comentariosRestaurados++;
                }
              });
            }
            
            if (topicEvals.size > 0) {
              restoredEvaluations.set(topicDefinition.id, topicEvals);
            }
            
            if (topic.observations) {
              restoredTopicObservations.set(topicDefinition.id, topic.observations);
            }
          }
        });
      }
      
      console.log('📊 Resumo da recuperação:', {
        itens: itemsRestaurados,
        fotos: fotosRestauradas,
        comentarios: comentariosRestaurados
      });
      
      setEvaluations(restoredEvaluations);
      setTopicObservations(restoredTopicObservations);
      
      if (itemsRestaurados > 0) {
        setCurrentStep('checklist');
        
        setTimeout(() => {
          let mensagem = `✅ Checklist recuperado!\n\n`;
          mensagem += `📋 ${itemsRestaurados} item(ns) restaurado(s)\n`;
          if (comentariosRestaurados > 0) mensagem += `💬 ${comentariosRestaurados} comentário(s)\n`;
          if (fotosRestauradas > 0) mensagem += `📸 ${fotosRestauradas} foto(s)\n`;
          mensagem += `\nVocê pode continuar de onde parou.`;
          
          alert(mensagem);
        }, 500);
      }
    }, 100);
  };

  const checkForBackupLocalStorage = () => {
    try {
      console.log('🔍 Verificando backup no localStorage...');
      const backup = localStorage.getItem('checklist_backup');
      
      if (!backup) {
        console.log('❌ Nenhum backup local encontrado');
        return;
      }

      const { evaluation, timestamp } = JSON.parse(backup);
      const backupDate = new Date(timestamp);
      const hoursDiff = (new Date().getTime() - backupDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        const confirmar = confirm(
          '💾 Encontramos um backup local!\n\n' +
          `📅 Salvo em: ${backupDate.toLocaleString('pt-BR')}\n` +
          `🏪 Loja: ${evaluation.storeName}\n` +
          `👤 Supervisor: ${evaluation.supervisorName}\n\n` +
          'Deseja recuperar?'
        );
        
        if (confirmar) {
          restoreFromDraft(evaluation);
          localStorage.removeItem('checklist_backup');
        }
      } else {
        localStorage.removeItem('checklist_backup');
      }
    } catch (e) {
      console.error('❌ Erro ao verificar backup local:', e);
      localStorage.removeItem('checklist_backup');
    }
  };

  useEffect(() => {
    if (selectedStoreId && stores.length > 0) {
      const store = stores.find(s => s.id === selectedStoreId);
      if (store) {
        setStoreName(store.name);
      }
    }
  }, [selectedStoreId, stores]);

  // 💾 Auto-save a cada 5 minutos durante o checklist (API + localStorage fallback)
  useEffect(() => {
    if (currentStep !== 'checklist') return;

    const saveNow = async () => {
      try {
        setSavingStatus('saving');
        
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

        // 🎯 Tentar salvar no servidor (prioridade)
        try {
          const response = await fetch('/api/checklist/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evaluation }),
          });

          if (response.ok) {
            const { draftId, lastSaved, totalItems, totalPhotos, totalComments } = await response.json();
            setCurrentDraftId(draftId);
            setLastAutoSave(new Date(lastSaved));
            setSavingStatus('saved');
            
            console.log('✅ Rascunho salvo no servidor:', {
              draftId,
              itens: totalItems,
              fotos: totalPhotos,
              comentarios: totalComments
            });

            // Salvar também no localStorage como backup offline
            try {
              localStorage.setItem('checklist_backup', JSON.stringify({
                evaluation,
                draftId,
                timestamp: new Date().toISOString()
              }));
            } catch (localError) {
              console.warn('⚠️ Não foi possível salvar no localStorage (mas está no servidor)');
            }

            // Limpar status após 3 segundos
            setTimeout(() => setSavingStatus('idle'), 3000);
          } else {
            throw new Error('Erro ao salvar no servidor');
          }
        } catch (apiError) {
          console.warn('⚠️ Sem conexão, salvando apenas localmente:', apiError);
          setSavingStatus('error');
          
          // Fallback: salvar no localStorage
          localStorage.setItem('checklist_backup', JSON.stringify({
            evaluation,
            timestamp: new Date().toISOString()
          }));
          
          setLastAutoSave(new Date());
          console.log('💾 Backup salvo localmente (offline)');

          // Limpar status após 5 segundos
          setTimeout(() => setSavingStatus('idle'), 5000);
        }
      } catch (e) {
        console.error('❌ Erro no auto-save:', e);
        setSavingStatus('error');
        setTimeout(() => setSavingStatus('idle'), 5000);
      }
    };

    // Salvar IMEDIATAMENTE ao entrar no checklist
    saveNow();
    console.log('💾 Primeiro auto-save realizado');

    const autoSaveInterval = setInterval(saveNow, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(autoSaveInterval);
  }, [currentStep, evaluations, topicObservations, maintenanceList, improvementSuggestions]);

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

  const setItemEvaluation = (topicId: string, itemId: string, status: EvaluationStatus, observations: string, photoUrls?: string[]) => {
    console.log('🔵 setItemEvaluation chamado:', { topicId, itemId, status, observations: observations ? 'sim' : 'não', fotos: photoUrls?.length || 0 });
    
    const topicEvals = evaluations.get(topicId) || new Map();
    const currentEval = topicEvals.get(itemId);
    topicEvals.set(itemId, { 
      status, 
      observations, 
      photoUrls: photoUrls !== undefined ? photoUrls : currentEval?.photoUrls 
    });
    const newEvaluations = new Map(evaluations);
    newEvaluations.set(topicId, topicEvals);
    setEvaluations(newEvaluations);
    
    console.log('✅ Item salvo no Map:', { topicId, itemId, status });

    // 💾 Salvar imediatamente após marcar um item (debounce de 500ms - mais rápido!)
    if (currentStep === 'checklist') {
      setTimeout(async () => {
        try {
          setSavingStatus('saving');
          
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

          // Tentar salvar no servidor
          try {
            const response = await fetch('/api/checklist/drafts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ evaluation }),
            });

            if (response.ok) {
              const { draftId, lastSaved } = await response.json();
              setCurrentDraftId(draftId);
              setLastAutoSave(new Date(lastSaved));
              setSavingStatus('saved');
              console.log('💾 Rascunho salvo após alteração');
              
              // Backup local
              try {
                localStorage.setItem('checklist_backup', JSON.stringify({
                  evaluation,
                  draftId,
                  timestamp: new Date().toISOString()
                }));
              } catch (localError) {
                // Ignorar erro de localStorage (já salvou no servidor)
              }

              setTimeout(() => setSavingStatus('idle'), 2000);
            } else {
              throw new Error('Erro ao salvar');
            }
          } catch (apiError) {
            // Fallback: localStorage
            localStorage.setItem('checklist_backup', JSON.stringify({
              evaluation,
              timestamp: new Date().toISOString()
            }));
            setLastAutoSave(new Date());
            setSavingStatus('idle');
            console.log('💾 Backup local salvo (offline)');
          }
        } catch (e) {
          console.error('Erro ao salvar:', e);
          setSavingStatus('error');
          setTimeout(() => setSavingStatus('idle'), 3000);
        }
      }, 500); // 500ms de debounce (mais rápido que antes)
    }
  };

  const handlePhotoUpload = async (topicId: string, itemId: string, files: FileList) => {
    try {
      const topicEvals = evaluations.get(topicId);
      const currentEval = topicEvals?.get(itemId);
      const currentPhotos = currentEval?.photoUrls || [];

      // Limitar a 10 fotos por item
      if (currentPhotos.length >= 10) {
        alert('⚠️ Limite máximo de 10 fotos por item atingido.\n\nRemova uma foto existente para adicionar uma nova.');
        return;
      }

      const remainingSlots = 10 - currentPhotos.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      if (filesToProcess.length < files.length) {
        alert(`ℹ️ Apenas ${filesToProcess.length} foto(s) serão adicionadas.\n\nLimite de 10 fotos por item.`);
      }

      // Processar todas as fotos (SEM COMPRESSÃO - salva qualidade original)
      console.log(`📸 Processando ${filesToProcess.length} foto(s)...`);
      
      const filePromises = filesToProcess.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const newPhotos = await Promise.all(filePromises);
      const updatedPhotos = [...currentPhotos, ...newPhotos];

      console.log(`✅ ${newPhotos.length} foto(s) adicionada(s) com qualidade original`);

      if (currentEval) {
        setItemEvaluation(topicId, itemId, currentEval.status, currentEval.observations, updatedPhotos);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('❌ Erro ao fazer upload da foto.\n\nTente novamente ou tire uma nova foto.');
    }
  };

  const handlePhotoDelete = (topicId: string, itemId: string, photoIndex: number) => {
    const topicEvals = evaluations.get(topicId);
    const currentEval = topicEvals?.get(itemId);
    
    if (currentEval && currentEval.photoUrls) {
      const updatedPhotos = currentEval.photoUrls.filter((_, index) => index !== photoIndex);
      setItemEvaluation(topicId, itemId, currentEval.status, currentEval.observations, updatedPhotos);
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
    
    console.log('📊 Calculando score, evaluations.size:', evaluations.size);

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
          
          // 🔍 Log apenas para itens "FORA DO PADRÃO" com dados
          if (evaluation.status === 'FORA DO PADRÃO' && (evaluation.observations || evaluation.photoUrls?.length)) {
            console.log('🔴 Item FORA DO PADRÃO com dados:', {
              item: item.name,
              comentario: evaluation.observations?.substring(0, 30),
              fotos: evaluation.photoUrls?.length || 0
            });
          }
        }

        // ✅ Só incluir itens que foram realmente avaliados
        // (ou seja, tem status definido OU tem comentário/foto)
        if (evaluation || (item.id && evaluations.get(topic.id)?.has(item.id))) {
          items.push({
            itemId: item.id,
            itemName: item.name,
            score,
            maxScore,
            status: evaluation?.status || 'FORA DO PADRÃO',
            observations: evaluation?.observations || '',
            photoUrls: evaluation?.photoUrls || [],
          });
        }

        topicScore += score;
        topicMaxScore += maxScore;
      });

      topicsData.push({
        topicId: topic.id, // 🆕 Adicionar ID do tópico para facilitar recuperação
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

    // 💾 Salvar backup no LocalStorage antes de tentar enviar
    try {
      localStorage.setItem('checklist_backup', JSON.stringify({
        evaluation,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Não foi possível salvar backup local:', e);
    }

    try {
      const response = await fetch('/api/checklist/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      });

      // 🔍 Verificar se a resposta é HTML (sessão expirada)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('SESSAO_EXPIRADA');
      }

      if (!response.ok) {
        // Tentar ler como JSON, mas com fallback
        let errorMessage = 'Erro ao salvar avaliação';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (jsonError) {
          // Se não conseguir fazer parse do JSON, usar texto
          const textError = await response.text();
          if (textError.includes('<!DOCTYPE') || textError.includes('<html')) {
            throw new Error('SESSAO_EXPIRADA');
          }
          errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // ✅ Sucesso! Limpar backup e deletar rascunho
      try {
        localStorage.removeItem('checklist_backup');
        
        // Deletar rascunho do servidor
        if (currentDraftId) {
          await fetch(`/api/checklist/drafts/${currentDraftId}`, {
            method: 'DELETE',
          });
          console.log('🗑️ Rascunho deletado do servidor');
        }
      } catch (e) {
        console.warn('Não foi possível limpar backup/rascunho:', e);
      }

      router.push(`/checklist/relatorio/${result.evaluationId}`);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      
      // 🚨 Tratamento especial para sessão expirada
      if (error instanceof Error && error.message === 'SESSAO_EXPIRADA') {
        const confirmar = confirm(
          '⏰ Sua sessão expirou após muito tempo sem atividade.\n\n' +
          '✅ Seus dados foram salvos localmente!\n\n' +
          'Clique OK para fazer login novamente e recuperar seu checklist.\n\n' +
          '⚠️ Não feche esta página ou perderá os dados!'
        );
        
        if (confirmar) {
          // Redirecionar para login mantendo a URL atual
          window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
      } else {
        // Outros erros
        alert(
          '❌ Erro ao salvar avaliação.\n\n' +
          (error instanceof Error ? error.message : 'Erro desconhecido') + '\n\n' +
          '💾 Seus dados foram salvos localmente como backup.\n' +
          'Tente novamente ou recarregue a página.'
        );
      }
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
            
            {/* 🧪 Botão de Debug (remover depois) */}
            <button
              onClick={() => {
                const backup = localStorage.getItem('checklist_backup');
                if (backup) {
                  const data = JSON.parse(backup);
                  
                  // 🔍 Encontrar itens "FORA DO PADRÃO" com dados
                  const itemsForaComDados: any[] = [];
                  data.evaluation.topics?.forEach((topic: any) => {
                    topic.items?.forEach((item: any) => {
                      if (item.status === 'FORA DO PADRÃO' && (
                        (item.observations && item.observations.trim() !== '') ||
                        (item.photoUrls && item.photoUrls.length > 0)
                      )) {
                        itemsForaComDados.push({
                          topico: topic.topicName,
                          item: item.itemName,
                          comentario: item.observations?.substring(0, 30) || '',
                          fotos: item.photoUrls?.length || 0
                        });
                      }
                    });
                  });
                  
                  console.log('📦 Backup completo:', data);
                  console.log('🔴 Itens FORA DO PADRÃO com dados:', itemsForaComDados);
                  
                  let mensagem = `📦 Backup encontrado!\n\n`;
                  mensagem += `Loja: ${data.evaluation.storeName}\n`;
                  mensagem += `Salvo: ${new Date(data.timestamp).toLocaleString('pt-BR')}\n\n`;
                  mensagem += `🔴 Itens "FORA DO PADRÃO" com dados: ${itemsForaComDados.length}\n\n`;
                  
                  if (itemsForaComDados.length > 0) {
                    mensagem += `Exemplos:\n`;
                    itemsForaComDados.slice(0, 3).forEach((i: any) => {
                      mensagem += `- ${i.item}\n  Comentário: ${i.comentario || '(vazio)'}\n  Fotos: ${i.fotos}\n`;
                    });
                  }
                  
                  alert(mensagem);
                } else {
                  alert('❌ Nenhum backup encontrado no localStorage');
                }
              }}
              className="w-full mb-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              🧪 Debug: Ver Backup Salvo
            </button>
            
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
                
                {/* Indicador de status de salvamento */}
                <div className="mt-2 flex items-center gap-2">
                  {savingStatus === 'saving' && (
                    <p className="text-xs text-blue-400 flex items-center gap-1 animate-pulse">
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
                      <span>Salvando...</span>
                    </p>
                  )}
                  {savingStatus === 'saved' && lastAutoSave && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <span>✅</span>
                      <span>Salvo às {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  )}
                  {savingStatus === 'error' && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Erro ao salvar (usando backup local)</span>
                    </p>
                  )}
                  {savingStatus === 'idle' && lastAutoSave && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span>💾</span>
                      <span>Último salvamento: {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  )}
                </div>
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
                              <div className="mt-3 space-y-3">
                                {/* Galeria de Fotos */}
                                {evaluation?.photoUrls && evaluation.photoUrls.length > 0 && (
                                  <div className="grid grid-cols-2 gap-3">
                                    {evaluation.photoUrls.map((photoUrl, index) => (
                                      <div key={index} className="relative group">
                                        <img 
                                          src={photoUrl} 
                                          alt={`Foto ${index + 1}`}
                                          className="w-full h-40 object-cover rounded-lg border border-[#374151]"
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handlePhotoDelete(topic.id, item.id, index);
                                          }}
                                          type="button"
                                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors opacity-90 hover:opacity-100"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                          Foto {index + 1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Botões de Upload */}
                                <div className="flex gap-2">
                                  {/* Input para Câmera */}
                                  <input
                                    ref={(el) => {
                                      if (el) fileInputRefs.current.set(`${uploadKey}-camera`, el);
                                    }}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handlePhotoUpload(topic.id, item.id, e.target.files);
                                        e.target.value = ''; // Reset para permitir adicionar a mesma foto novamente
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  
                                  {/* Input para Galeria (múltiplas fotos) */}
                                  <input
                                    ref={(el) => {
                                      if (el) fileInputRefs.current.set(`${uploadKey}-gallery`, el);
                                    }}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handlePhotoUpload(topic.id, item.id, e.target.files);
                                        e.target.value = ''; // Reset para permitir adicionar a mesma foto novamente
                                      }
                                    }}
                                    className="hidden"
                                  />

                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      fileInputRefs.current.get(`${uploadKey}-camera`)?.click();
                                    }}
                                    type="button"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
                                  >
                                    <Camera className="w-4 h-4" />
                                    Tirar Foto
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      fileInputRefs.current.get(`${uploadKey}-gallery`)?.click();
                                    }}
                                    type="button"
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Da Galeria
                                  </button>
                                </div>

                                {evaluation?.photoUrls && evaluation.photoUrls.length > 0 && (
                                  <p className="text-xs text-gray-400">
                                    {evaluation.photoUrls.length} foto(s) adicionada(s)
                                  </p>
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

