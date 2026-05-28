"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const baseUrl = "/api";
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setAuthToken(data.token);
          router.push("/admin");
        }
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-800">
        
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#F1C40F] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#F1C40F]/20">
            <svg className="w-8 h-8 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Bairamburguer • Gestão de Pedidos</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 ml-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bairamburguer.com"
              className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#F1C40F] focus:ring-1 focus:ring-[#F1C40F] transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-300 ml-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#121212] border border-gray-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#F1C40F] focus:ring-1 focus:ring-[#F1C40F] transition-all placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F1C40F] hover:bg-[#D4AC0D] text-[#121212] font-black py-4 rounded-xl mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? "Validando..." : "Acessar Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
