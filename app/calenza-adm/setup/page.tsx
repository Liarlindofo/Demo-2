"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/ui/notification";
import { Shield, Loader2 } from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();
  const { showNotification, NotificationContainer } = useNotification();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkIfSetupNeeded();
  }, []);

  const checkIfSetupNeeded = async () => {
    try {
      // Tentar fazer login com credenciais padrão para verificar se usuário existe
      const response = await fetch("/api/calenza-adm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "plateclz",
          password: "word5785",
        }),
      });

      if (response.ok) {
        // Usuário existe, redirecionar para login
        router.push("/calenza-adm/login");
        return;
      }

      // Se não conseguiu fazer login, provavelmente o usuário não existe
      setNeedsSetup(true);
    } catch (error) {
      // Em caso de erro, assumir que precisa setup
      setNeedsSetup(true);
    } finally {
      setChecking(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/calenza-adm/seed", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.error || "Erro ao criar usuário admin",
          "error"
        );
        setLoading(false);
        return;
      }

      showNotification(
        "Usuário admin master criado com sucesso! Redirecionando...",
        "success"
      );

      setTimeout(() => {
        router.push("/calenza-adm/login");
      }, 2000);
    } catch (error) {
      console.error("Erro ao criar admin:", error);
      showNotification("Erro ao criar usuário admin. Tente novamente.", "error");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#001F05] mx-auto mb-4" />
          <p className="text-gray-400">Verificando configuração...</p>
        </div>
      </div>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-[#001F05] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Setup Inicial
            </h1>
            <p className="text-gray-400">
              Configure o usuário administrador master
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-[#0f0f10] border border-[#374151] rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Credenciais padrão que serão criadas:</strong>
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="text-white">plateclz</span>
                </p>
                <p className="text-gray-400">
                  <span className="text-gray-500">Senha:</span>{" "}
                  <span className="text-white">word5785</span>
                </p>
                <p className="text-gray-400">
                  <span className="text-gray-500">Role:</span>{" "}
                  <span className="text-white">super_admin</span>
                </p>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                ⚠️ <strong>Importante:</strong> Após o primeiro login, altere
                a senha padrão por segurança.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateAdmin}
            disabled={loading}
            className="w-full bg-[#001F05] hover:bg-[#001F05]/80 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando usuário...
              </>
            ) : (
              "Criar Usuário Admin Master"
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Este processo é executado apenas uma vez
            </p>
          </div>
        </div>
      </div>

      <NotificationContainer />
    </div>
  );
}
