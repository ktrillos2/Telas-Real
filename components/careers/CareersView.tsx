"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Users2,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  Upload,
  FileText,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Vacancy {
  _id: string;
  title: string;
  city?: string;
  modality?: string;
  schedule?: string;
  department?: string;
  description?: string;
  requirements?: string[];
  conditions?: string;
  isOpen?: boolean;
}

interface CareersViewProps {
  vacancies: Vacancy[];
}

export function CareersView({ vacancies }: CareersViewProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [autorizacion, setAutorizacion] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleApplyClick = (jobTitle: string) => {
    setSelectedPosition(jobTitle);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMessage("El archivo supera el límite de 10 MB. Por favor adjunta un archivo más liviano.");
        return;
      }
      setErrorMessage("");
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!autorizacion) {
      setErrorMessage("Debes aceptar la autorización para el tratamiento de datos personales.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("ciudad", ciudad);
      formData.append("telefono", telefono);
      formData.append("correo", correo);
      formData.append("cargo", selectedPosition || "Postulación General");
      formData.append("mensaje", mensaje);
      formData.append("autorizacionDatos", String(autorizacion));
      if (file) {
        formData.append("hojaVida", file);
      }

      const res = await fetch("/api/trabaja-con-nosotros", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al enviar tu postulación.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-background py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-primary/10 overflow-hidden">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary shadow-sm mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Haz parte de nuestro equipo</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight mb-6">
            Trabaja con <span className="font-semibold text-primary">Telas Real</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
            En Telas Real creemos que el talento humano es el motor de nuestro crecimiento. Buscamos personas comprometidas con el servicio, las ventas y el mundo textil, que quieran aportar sus capacidades y crecer junto a una empresa con presencia nacional.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Postularme Ahora
            </Button>
            <a
              href="#vacantes"
              className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium border border-primary/30 hover:bg-primary/5 transition-colors"
            >
              Ver Vacantes Disponibles
            </a>
          </div>
        </div>
      </section>

      {/* 2. ¿POR QUÉ TRABAJAR EN TELAS REAL? */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-primary mb-4">
              ¿Por qué trabajar en Telas Real?
            </h2>
            <p className="text-muted-foreground font-light text-base">
              Fomentamos un entorno de colaboración, respeto y desarrollo continuo para cada miembro de nuestra familia textil.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Oportunidades de aprendizaje y crecimiento",
                desc: "Espacios para potenciar tus talentos y avanzar en tu carrera profesional.",
              },
              {
                icon: Sparkles,
                title: "Capacitación continua",
                desc: "Fortalecemos tus conocimientos y habilidades sobre el apasionante universo textil y comercial.",
              },
              {
                icon: Users2,
                title: "Trabajo colaborativo",
                desc: "Cultura orientada al compañerismo, empatía, apoyo mutuo y servicio de excelencia.",
              },
              {
                icon: Building,
                title: "Presencia nacional",
                desc: "Aporta al crecimiento de una empresa líder del sector textil con presencia en diferentes ciudades del país.",
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#E8F4F8] text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <pillar.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. VACANTES DISPONIBLES (DINÁMICAS) */}
      <section id="vacantes" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Convocatorias Activas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-primary mb-3">
              Vacantes Disponibles
            </h2>
            <p className="text-muted-foreground font-light text-base">
              Explora nuestras convocatorias abiertas y encuentra la oportunidad ideal para ti.
            </p>
          </div>

          {vacancies && vacancies.length > 0 ? (
            <div className="space-y-6">
              {vacancies.map((vacancy) => (
                <div
                  key={vacancy._id}
                  className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Vacante disponible
                      </span>
                      {vacancy.department && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground">
                          {vacancy.department}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {vacancy.title}
                    </h3>

                    {vacancy.description && (
                      <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
                        {vacancy.description}
                      </p>
                    )}

                    {vacancy.requirements && vacancy.requirements.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                          Perfil y Habilidades Buscadas:
                        </h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                          {vacancy.requirements.map((req, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-3 border-t border-border/50">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        {vacancy.city || "Bogotá, Colombia"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {vacancy.modality || "Presencial"}
                      </span>
                      {vacancy.schedule && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary" />
                          {vacancy.schedule}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/50 flex flex-col justify-center">
                    <Button
                      onClick={() => handleApplyClick(vacancy.title)}
                      className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm w-full md:w-auto"
                    >
                      Postularme
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto stroke-1" />
              <h3 className="text-xl font-medium text-foreground">
                No hay convocatorias específicas abiertas en este momento
              </h3>
              <p className="text-sm text-muted-foreground font-light">
                Sin embargo, ¡siempre queremos conocer nuevo talento! Diligencia el formulario a continuación como postulación general y guardaremos tu perfil para futuras vacantes.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. FORMULARIO DE POSTULACIÓN */}
      <section ref={formRef} className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl shadow-black/5">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4F8] text-primary mb-3">
                <Send className="w-3.5 h-3.5" />
                <span>Envíanos tu perfil</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                Formulario de Postulación
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-light">
                Completa tus datos personales y adjunta tu hoja de vida para participar en nuestros procesos de selección.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-semibold text-emerald-900">
                  ¡Postulación Enviada con Éxito!
                </h3>
                <p className="text-emerald-800 text-sm sm:text-base max-w-md mx-auto font-light leading-relaxed">
                  Hemos recibido tu información y tu hoja de vida. Nuestro equipo de Talento Humano revisará tu perfil con detenimiento.
                </p>
                <div className="pt-4 border-t border-emerald-200/60 text-xs text-emerald-700 font-light max-w-md mx-auto">
                  <strong>Importante:</strong> El envío de la hoja de vida no garantiza la vinculación laboral. Telas Real contactará únicamente a las personas que continúen en el proceso de selección.
                </div>
                <Button
                  variant="outline"
                  className="rounded-full mt-4 border-emerald-300 hover:bg-emerald-100/60 text-emerald-800"
                  onClick={() => {
                    setSubmitted(false);
                    setNombre("");
                    setCiudad("");
                    setTelefono("");
                    setCorreo("");
                    setMensaje("");
                    setFile(null);
                    setAutorizacion(false);
                  }}
                >
                  Enviar otra postulación
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMessage && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Cargo */}
                <div>
                  <label htmlFor="cargo" className="block text-sm font-medium text-foreground mb-1.5">
                    Cargo al que deseas aplicar <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="cargo"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">-- Selecciona el cargo --</option>
                    {vacancies.map((v) => (
                      <option key={v._id} value={v.title}>
                        {v.title} ({v.city || "Bogotá"})
                      </option>
                    ))}
                    <option value="Postulación General">Postulación General / Otra Área</option>
                  </select>
                </div>

                {/* Nombre y Ciudad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-1.5">
                      Nombre completo <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Ej: María Gómez"
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-foreground mb-1.5">
                      Ciudad de residencia <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="ciudad"
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      required
                      placeholder="Ej: Bogotá D.C."
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Teléfono y Correo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-foreground mb-1.5">
                      Número de teléfono / WhatsApp <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      required
                      placeholder="Ej: 315 902 1516"
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="correo" className="block text-sm font-medium text-foreground mb-1.5">
                      Correo electrónico <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="correo"
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                      placeholder="Ej: maria@correo.com"
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Por qué su perfil puede aportar */}
                <div>
                  <label htmlFor="mensaje" className="block text-sm font-medium text-foreground mb-1.5">
                    Cuéntanos por qué tu perfil puede aportar a Telas Real <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    rows={4}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                    placeholder="Describe brevemente tu experiencia, habilidades comerciales o técnicas, y tu motivación para formar parte de nuestro equipo..."
                    className="w-full rounded-xl border border-input bg-background p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                  />
                </div>

                {/* Adjuntar Hoja de Vida */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Hoja de vida adjunta (PDF o Word) <span className="text-destructive">*</span>
                  </label>
                  <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 text-center transition-all bg-muted/20 hover:bg-muted/30 relative">
                    {file ? (
                      <div className="flex items-center justify-between bg-card border border-border p-3 rounded-xl max-w-md mx-auto">
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                          <FileText className="w-8 h-8 text-primary shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                          title="Eliminar archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2 stroke-1" />
                        <p className="text-sm font-medium text-foreground">
                          Arrastra tu archivo aquí o{" "}
                          <label
                            htmlFor="hojaVidaInput"
                            className="text-primary hover:underline cursor-pointer font-semibold"
                          >
                            selecciónalo desde tu dispositivo
                          </label>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos aceptados: PDF, DOC, DOCX (Máximo 10 MB)
                        </p>
                        <input
                          id="hojaVidaInput"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          required
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Autorización Tratamiento de Datos */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="autorizacion"
                    type="checkbox"
                    checked={autorizacion}
                    onChange={(e) => setAutorizacion(e.target.checked)}
                    required
                    className="w-4 h-4 mt-1 rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="autorizacion" className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Autorizo de manera libre, previa y expresa a <strong>Telas Real S.A.S.</strong> para el tratamiento de mis datos personales de acuerdo con su{" "}
                    <Link
                      href="/politica-de-privacidad"
                      target="_blank"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Política de Privacidad y Manejo de Datos
                    </Link>
                    , con el fin de evaluar mi postulación laboral y contactarme durante el proceso de selección.
                  </label>
                </div>

                {/* Botón de Envío */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full rounded-full py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Enviando postulación...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Enviar Postulación
                    </span>
                  )}
                </Button>

                {/* Disclaimer Legal */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 text-xs text-muted-foreground font-light leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong>Importante:</strong> El envío de la hoja de vida no garantiza la vinculación laboral. Telas Real contactará únicamente a las personas que continúen en el proceso de selección.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
