import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que NÃO precisam de autenticação
const PUBLIC_PATHS = ["/login"];

// Prefixos de assets/API que não devem ser interceptados
const IGNORED_PREFIXES = ["/_next", "/api", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar assets, API routes e arquivos estáticos
  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Verificar se é rota pública
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Verificar token de acesso no cookie ou header
  // Nota: Como usamos localStorage no client, o middleware do Next.js (server-side)
  // não consegue acessar localStorage. A proteção principal é feita no client-side
  // pelo AuthProvider. Este middleware é uma camada adicional para quando cookies
  // forem implementados no futuro.
  //
  // Por enquanto, permitimos o acesso — a proteção client-side do AuthProvider
  // cuidará do redirect.
  return NextResponse.next();
}

export const config = {
  // Rodar o middleware em todas as rotas exceto assets estáticos
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
