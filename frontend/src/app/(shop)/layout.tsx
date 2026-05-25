export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex-1">
        {children}
      </div>
      <footer className="w-full text-center py-4 text-xs text-zinc-500 pb-20">
        Developed by Marcondes
      </footer>
    </div>
  );
}
