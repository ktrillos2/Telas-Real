import { Metadata } from "next";
import { FaqView } from "@/components/faq/FaqView";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes (FAQ) | Telas Real Colombia",
  description:
    "Respuestas a las dudas más comunes sobre compra de telas por metro, envíos nacionales a toda Colombia, sublimación personalizada, medios de pago en Wompi, cambios y garantías legales.",
};

export default function PreguntasFrecuentesPage() {
  return (
    <main>
      <FaqView />
    </main>
  );
}
