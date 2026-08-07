"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin";

export function StoreToggle() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getStoreStatus()
      .then((data) => {
        setIsOpen(data.isOpen);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar status da loja:", err);
        setError("Não foi possível carregar o estado da loja.");
        setLoading(false);
      });
  }, []);

  const handleToggle = async () => {
    if (loading) return;
    const previous = isOpen;
    setIsOpen(!previous);
    setError(null);
    setLoading(true);
    try {
      const data = await adminService.toggleStoreStatus();
      setIsOpen(data.isOpen);
    } catch (err) {
      console.error(err);
      setIsOpen(previous);
      setError("Não foi possível alterar o estado da loja.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Carregando...</div>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:ring-offset-2 focus:ring-offset-[#1E1E1E] ${isOpen ? "bg-green-500" : "bg-red-600"}`}
        aria-pressed={isOpen}
        aria-label={`Loja ${isOpen ? "aberta" : "fechada"}. Clique para ${isOpen ? "fechar" : "abrir"}.`}
        title={`Loja ${isOpen ? "aberta" : "fechada"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOpen ? "translate-x-7" : "translate-x-1"}`} />
      </button>
      {error && <span role="alert" className="max-w-32 text-right text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
