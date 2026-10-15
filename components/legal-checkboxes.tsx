"use client"

import React from "react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ShieldCheck, FileText } from "lucide-react"

export interface LegalCheckboxesProps {
  acceptTerms: boolean
  onAcceptTermsChange: (checked: boolean) => void
  acceptPrivacy: boolean
  onAcceptPrivacyChange: (checked: boolean) => void
  termsId?: string
  privacyId?: string
  className?: string
  variant?: "default" | "compact"
  termsUrl?: string
  privacyUrl?: string
  errorTerms?: boolean
  errorPrivacy?: boolean
  showBadge?: boolean
}

export function LegalCheckboxes({
  acceptTerms,
  onAcceptTermsChange,
  acceptPrivacy,
  onAcceptPrivacyChange,
  termsId = "accept-terms",
  privacyId = "accept-privacy",
  className = "",
  variant = "default",
  termsUrl = "/terminos-y-condiciones",
  privacyUrl = "/politica-de-privacidad",
  errorTerms = false,
  errorPrivacy = false,
  showBadge = true,
}: LegalCheckboxesProps) {
  const isCompact = variant === "compact"

  return (
    <div
      className={`rounded-xl border ${
        errorTerms || errorPrivacy
          ? "border-red-400 bg-red-50/20 dark:bg-red-950/20"
          : "border-border/80 bg-muted/20"
      } ${isCompact ? "p-3 space-y-2.5" : "p-4 sm:p-5 space-y-3.5"} ${className}`}
    >
      {showBadge && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Consentimiento y Protección Legal</span>
        </div>
      )}

      {/* Checkbox 1: Términos y Condiciones */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={termsId}
          checked={acceptTerms}
          onCheckedChange={(checked) => onAcceptTermsChange(checked === true)}
          className={`mt-0.5 cursor-pointer ${
            errorTerms
              ? "border-red-500 ring-2 ring-red-400/30"
              : "border-muted-foreground/40"
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={termsId}
            className={`font-normal text-muted-foreground leading-snug cursor-pointer block select-none ${
              isCompact ? "text-xs" : "text-xs sm:text-sm"
            } ${errorTerms ? "text-red-600 dark:text-red-400 font-medium" : ""}`}
          >
            He leído y acepto los{" "}
            <Link
              href={termsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
            >
              <span>Términos y Condiciones</span>
            </Link>{" "}
            del sitio web y de compra. <span className="text-primary font-bold">*</span>
          </Label>
          {errorTerms && (
            <p className="text-[11px] text-red-500 font-medium mt-0.5">
              Debes aceptar los Términos y Condiciones para continuar.
            </p>
          )}
        </div>
      </div>

      {/* Checkbox 2: Política de Tratamiento de Datos Personales */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={privacyId}
          checked={acceptPrivacy}
          onCheckedChange={(checked) => onAcceptPrivacyChange(checked === true)}
          className={`mt-0.5 cursor-pointer ${
            errorPrivacy
              ? "border-red-500 ring-2 ring-red-400/30"
              : "border-muted-foreground/40"
          }`}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={privacyId}
            className={`font-normal text-muted-foreground leading-snug cursor-pointer block select-none ${
              isCompact ? "text-xs" : "text-xs sm:text-sm"
            } ${errorPrivacy ? "text-red-600 dark:text-red-400 font-medium" : ""}`}
          >
            Autorizo de manera libre, previa y expresa el tratamiento de mis datos personales de acuerdo con la{" "}
            <Link
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors inline-flex items-center gap-0.5"
            >
              <span>Política de Privacidad y Tratamiento de Datos</span>
            </Link>{" "}
            (Ley 1581 de 2012 / Habeas Data). <span className="text-primary font-bold">*</span>
          </Label>
          {errorPrivacy && (
            <p className="text-[11px] text-red-500 font-medium mt-0.5">
              Debes autorizar el tratamiento de datos personales para continuar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
