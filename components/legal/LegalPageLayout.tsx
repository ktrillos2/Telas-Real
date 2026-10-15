"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calendar,
  Building2,
  Phone,
  ChevronRight,
  Printer,
  FileText,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  badge: string;
  title: string;
  description: string;
  lastUpdated?: string;
  sections: LegalSection[];
  relatedLinks?: Array<{ title: string; href: string }>;
}

export function LegalPageLayout({
  badge,
  title,
  description,
  lastUpdated = "Octubre 2026",
  sections,
  relatedLinks,
}: LegalPageLayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  const handleScrollTo = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-background py-14 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-primary/10">
        <div className="container mx-auto max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-tight">
            {title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Vigencia actualizada: {lastUpdated}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Telas Real S.A.S. • NIT 901232650-1
            </span>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT + TABLE OF CONTENTS */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* STICKY SIDEBAR (TABLE OF CONTENTS) */}
            <aside className="lg:col-span-4 sticky top-20 z-10 hidden lg:block">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Índice del documento</span>
                </h2>
                <nav className="space-y-1">
                  {sections.map((sec, idx) => (
                    <button
                      key={sec.id}
                      onClick={() => handleScrollTo(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-start gap-2 ${
                        activeId === sec.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span className="shrink-0 text-primary/70 font-mono text-xs mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="leading-snug">{sec.title}</span>
                    </button>
                  ))}
                </nav>

                {relatedLinks && relatedLinks.length > 0 && (
                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Documentos relacionados
                    </span>
                    <ul className="space-y-1 text-xs">
                      {relatedLinks.map((link, lIdx) => (
                        <li key={lIdx}>
                          <Link
                            href={link.href}
                            className="text-primary hover:underline flex items-center justify-between py-1"
                          >
                            <span>{link.title}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>

            {/* SECTIONS CONTENT */}
            <div className="lg:col-span-8 space-y-10 md:space-y-12">
              {sections.map((sec, idx) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm scroll-mt-24 space-y-4"
                >
                  <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#E8F4F8] text-primary flex items-center justify-center text-xs font-bold font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                      {sec.title}
                    </h2>
                  </div>

                  <div className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed space-y-3 prose-p:my-2 prose-ul:my-2">
                    {sec.content}
                  </div>
                </article>
              ))}

              {/* Legal Footer Card */}
              <div className="bg-[#E8F4F8] border border-primary/20 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-primary">
                  ¿Tienes dudas sobre esta política o necesitas radicar una solicitud?
                </h3>
                <p className="text-sm text-muted-foreground font-light max-w-xl mx-auto">
                  Nuestro canal oficial de atención y PQRS está a tu completa disposición para orientarte y resolver cualquier requerimiento.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link href="/pqr">
                    <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5">
                      Ir a Centro de Ayuda y PQRS
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
