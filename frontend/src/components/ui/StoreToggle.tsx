"use client";

import React, { useEffect, useState } from "react";
import { adminService } from "@/services/admin";

export function StoreToggle() {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStoreStatus()
      .then((data) => {
        setIsOpen(data.isOpen);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar status da loja:", err);
        setLoading(false);
      });
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const data = await adminService.toggleStoreStatus();
      setIsOpen(data.isOpen);
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar o status da loja. Verifique o seu acesso.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Carregando...</div>;
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors focus:outline-none ${isOpen ? "bg-green-500" : "bg-red-600"}`}
      aria-pressed={isOpen}
      aria-label="Alternar estado da loja"
    >
      <span className="sr-only">Loja {isOpen ? "Aberta" : "Fechada"}</span>
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOpen ? "translate-x-7" : "translate-x-1"}`}
      />
    </button>
  );
}
