import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aprova · Revisão de entregas",
  description: "Envie trabalhos para revisão e compartilhe a versão certa.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body><header><span className="brand">aprova<span>.</span></span><span className="eyebrow">Revisão de entregas</span></header>{children}</body></html>;
}
