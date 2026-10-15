import { Metadata } from "next";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { CareersView, Vacancy } from "@/components/careers/CareersView";

export const metadata: Metadata = {
  title: "Haz parte de nuestro equipo — Trabaja con nosotros | Telas Real",
  description:
    "En Telas Real creemos que el talento humano es el motor de nuestro crecimiento. Conoce nuestras vacantes disponibles y postúlate para crecer junto a nosotros.",
};

export const revalidate = 60; // Revalidate every minute so new job postings appear quickly

export default async function TrabajaConNosotrosPage() {
  let vacancies: Vacancy[] = [];

  try {
    vacancies = await client.fetch<Vacancy[]>(
      groq`*[_type == "jobVacancy" && isOpen != false] | order(order asc, _createdAt desc) {
        _id,
        title,
        city,
        modality,
        schedule,
        department,
        description,
        requirements,
        conditions,
        isOpen
      }`
    );
  } catch (error) {
    console.error("Error fetching vacancies from Sanity:", error);
  }

  // Fallback predeterminado si aún no hay vacantes en Sanity
  if (!vacancies || vacancies.length === 0) {
    vacancies = [
      {
        _id: "default-asesor",
        title: "Asesor comercial",
        city: "Bogotá D.C. (y sedes nacionales)",
        modality: "Presencial",
        schedule: "Lunes a Sábado, horario comercial",
        department: "Comercial y Ventas",
        description:
          "Buscamos personas con orientación al cliente, habilidades comerciales, comunicación clara y disposición para aprender sobre nuestro portafolio de telas.",
        requirements: [
          "Orientación al cliente y vocación de servicio",
          "Habilidades comerciales y fluidez verbal",
          "Comunicación clara y trabajo colaborativo",
          "Disposición para aprender sobre nuestro catálogo textil",
        ],
        conditions: "Contrato con todas las prestaciones de ley y estabilidad laboral.",
        isOpen: true,
      },
    ];
  }

  return (
    <main>
      <CareersView vacancies={vacancies} />
    </main>
  );
}
