import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SysWebPat - Sistema de Patrimônio",
  description: "Sistema de Gerenciamento de Patrimônio Hospitalar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
