import Image from "next/image";

export const ADMIN_LOGO_SRC = "/images/bairam-logo-admin.png";

export function AdminBrand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <Image src={ADMIN_LOGO_SRC} alt="Logo Bairam Burguer" width={36} height={36} className="rounded-full object-cover" priority />;
  }

  return (
    <div className="flex items-center gap-3">
      <Image src={ADMIN_LOGO_SRC} alt="Logo Bairam Burguer" width={58} height={58} className="rounded-full border border-[#F1C40F]/30 object-cover shadow-lg" priority />
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-[#F1C40F]">Bairamburguer</h2>
        <p className="mt-0.5 text-xs text-zinc-400">Painel do Administrador</p>
      </div>
    </div>
  );
}
