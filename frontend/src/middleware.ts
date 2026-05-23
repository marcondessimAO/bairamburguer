import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('bairamburguer_token')?.value;
  const { pathname } = request.nextUrl;

  // Se o usuário tenta acessar uma rota protegida (dentro de /admin)
  if (pathname.startsWith('/admin')) {
    // Exceção: a própria página de login não deve ser bloqueada se ele não tiver token
    if (pathname === '/login') {
      // Se ele já tiver token e tentar acessar o /login, mandar para o painel
      if (token) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    // Se não tem token e tenta acessar algo em /admin (exceto o que estiver fora como login solto, mas nosso login é /login)
    // Na verdade, a página de login está em /login ou /admin/login?
    // Pela estrutura é app/(admin)/login, então a URL pública é /login.
  }

  // Se o pathname for /login e o usuário já tiver token
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Proteção da raiz do painel /admin (já que login é /login, não começa com /admin)
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin', '/login'],
};
