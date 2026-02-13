"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotification } from "@/components/ui/notification";
import { Lock, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { showNotification, NotificationContainer } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/calenza-adm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showNotification(data.error || "Erro ao fazer login", "error");
        setLoading(false);
        return;
      }

      showNotification("Login realizado com sucesso!", "success");
      router.push("/calenza-adm");
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);
      showNotification("Erro ao fazer login. Tente novamente.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Plateful Admin</h1>
            <p className="text-gray-400">Painel Administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <Label htmlFor="email" className="text-gray-300 mb-2 block">
                Email ou Usuário
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="pl-10 bg-[#0f0f10] border-[#374151] text-white"
                  placeholder="plateclz ou seu@email.com"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 mb-2 block">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="pl-10 bg-[#0f0f10] border-[#374151] text-white"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#001F05] hover:bg-[#001F05]/80 text-white"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Acesso restrito ao pessoal autorizado
            </p>
            <Link
              href="/calenza-adm/setup"
              className="text-xs text-[#001F05] hover:text-[#001F05]/80 flex items-center justify-center gap-1"
            >
              Primeira vez? Configure o usuário master
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <NotificationContainer />
    </div>
  );
}
