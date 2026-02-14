"use client";

import { Lock } from "lucide-react";

interface ToolLockProps {
  toolName: string;
  message?: string;
}

export default function ToolLock({ toolName, message }: ToolLockProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-yellow-500/50 rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-full p-4">
            <Lock className="h-12 w-12 text-yellow-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">
          Acesso Bloqueado
        </h2>
        <p className="text-gray-400 mb-4">
          {message || `Você não tem permissão para acessar a ferramenta "${toolName}".`}
        </p>
        <p className="text-sm text-gray-500">
          Entre em contato com o administrador do sistema para solicitar acesso.
        </p>
      </div>
    </div>
  );
}
