import Link from 'next/link';
import { LayoutDashboard, MenuSquare, LogOut, BarChart3, Store } from 'lucide-react';
import { StoreToggle } from '@/components/ui/StoreToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212] flex text-zinc-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E1E1E] border-r border-zinc-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-[#F1C40F]">
            Bairamburguer
          </h2>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Painel do Administrador</p>
          <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Loja</span>
            </div>
            <StoreToggle />
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors group"
          >
            <BarChart3 className="w-5 h-5 group-hover:text-[#F1C40F] transition-colors" />
            <span className="font-medium group-hover:translate-x-1 transition-transform">Dashboard</span>
          </Link>
          <Link 
            href="/admin"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors group"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:text-[#F1C40F] transition-colors" />
            <span className="font-medium group-hover:translate-x-1 transition-transform">Kanban Cozinha</span>
          </Link>
          
          <Link 
            href="/admin/menu"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors group"
          >
            <MenuSquare className="w-5 h-5 group-hover:text-[#F1C40F] transition-colors" />
            <span className="font-medium group-hover:translate-x-1 transition-transform">Gerir Cardápio</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link 
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair / Voltar à Loja</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#1E1E1E] p-4 border-b border-zinc-800 flex justify-between items-center gap-2">
          <h2 className="text-lg font-bold text-[#F1C40F]">Bairam</h2>
          <div className="flex items-center gap-3 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
            <Store className="w-4 h-4 text-zinc-400" />
            <StoreToggle />
          </div>
          <div className="flex space-x-3 text-xs font-medium">
            <Link href="/admin/dashboard" className="text-zinc-400 hover:text-zinc-100 transition-colors">Dash</Link>
            <Link href="/admin" className="text-zinc-400 hover:text-zinc-100 transition-colors">Kanban</Link>
            <Link href="/admin/menu" className="text-zinc-400 hover:text-zinc-100 transition-colors">Menu</Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[#121212] p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
