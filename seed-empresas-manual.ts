import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function seedEmpresas() {
  try {
    console.log('Iniciando seed de empresas...')

    // 1. Upload Banner
    let imageAssetRef = null
    const imagePath = path.join(process.cwd(), 'public', 'banner-hq.png')
    
    if (fs.existsSync(imagePath)) {
      console.log('Subiendo imagen de banner...')
      const buffer = fs.readFileSync(imagePath)
      const asset = await client.assets.upload('image', buffer, {
        filename: 'banner-hq.png'
      })
      imageAssetRef = asset._id
      console.log('Imagen subida con ID:', imageAssetRef)
    } else {
      console.log('No se encontró la imagen en public/banner-hq.png')
    }

    // 2. Data to upload
    const doc = {
      _id: 'empresas-page',
      _type: 'empresasPage',
      seoTitle: 'Ventas Corporativas y B2B | Telas Real',
      seoDescription: 'Soluciones textiles integrales para empresas. Precios mayoristas, abastecimiento garantizado y asesoría especializada en telas y sublimación.',
      hero: {
        tagline: 'Canal Mayorista B2B',
        title: 'Potenciamos el crecimiento de tu empresa',
        description: 'Soluciones textiles integrales con capacidad de respuesta para grandes volúmenes. Precios especiales, abastecimiento garantizado y calidad de primer nivel.',
        buttonText: 'Solicitar Asesoría Mayorista',
        ...(imageAssetRef ? {
          backgroundImage: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: imageAssetRef
            }
          }
        } : {})
      },
      introduction: {
        title: '¿Por qué elegir nuestro canal mayorista?',
        description: 'Entendemos que en la industria textil, la puntualidad, la calidad y el volumen son factores críticos para el éxito. En Telas Real hemos diseñado un canal corporativo exclusivo para pronta moda, talleres de confección y distribuidores que buscan un proveedor confiable y a largo plazo.'
      },
      stats: {
        years: 7,
        clients: 200,
        tons: 1400,
        inventory: 500000
      },
      successCases: {
        title: 'Clientes que crecen con Telas Real',
        subtitle: 'Casos reales de éxito e impacto en la industria.',
        cases: [
          {
            _key: 'case_1',
            clientName: 'Sebastian',
            problem: 'Retrasos constantes en la entrega de telas sublimadas para sus colecciones principales, afectando sus lanzamientos.',
            solution: 'Implementación de un plan de abastecimiento programado con Telas Real, asegurando stock en bodega y sublimación in-house.',
            result: 'Reducción del 40% en tiempos de producción y aumento de capacidad de respuesta ante picos de demanda.',
            colorTheme: 'blue'
          },
          {
            _key: 'case_2',
            clientName: 'Leidy Rodriguez',
            problem: 'Inconsistencia en los tonos de las telas entre diferentes lotes de producción, generando rechazos por parte del cliente final.',
            solution: 'Telas Real desarrolló una estandarización de colorimetría exclusiva para la marca y asignó un inventario reservado por temporada.',
            result: '0% de rechazos por variación de tono y crecimiento del 25% en licitaciones ganadas.',
            colorTheme: 'purple'
          },
          {
            _key: 'case_3',
            clientName: 'Tai Clothes',
            problem: 'Problemas con la calidad de insumos para escalar su línea de moda, limitando su expansión.',
            solution: 'Asesoría personalizada en telas y establecimiento de un canal de distribución ágil para sus volúmenes requeridos.',
            result: 'Crecimiento sostenido con un proveedor que escala al ritmo de la marca garantizando calidad superior.',
            colorTheme: 'orange'
          }
        ]
      },
      formSection: {
        tagline: 'SOLUCIONES A MEDIDA',
        title: 'Hablemos de negocios',
        description: 'Completa el formulario y uno de nuestros asesores mayoristas se comunicará contigo para brindarte una solución oportuna.',
        footerText: 'Garantizamos la privacidad de tus datos. Al enviar el formulario aceptas nuestra política de tratamiento de datos.',
        benefits: [
          { 
            _key: 'benefit_1',
            icon: 'Package', 
            title: 'Precios mayoristas', 
            description: 'Accede a precios especiales por volumen y frecuencia de compra.' 
          },
          { 
            _key: 'benefit_2',
            icon: 'Truck', 
            title: 'Abastecimiento garantizado', 
            description: 'Capacidad de respuesta para temporadas altas y entregas programadas.' 
          },
          { 
            _key: 'benefit_3',
            icon: 'Building2', 
            title: 'Servicios especializados', 
            description: 'Sublimación personalizada, desarrollos a la medida y asesoría en telas.' 
          }
        ]
      }
    }

    console.log('Guardando en Sanity...')
    await client.createOrReplace(doc)
    console.log('¡Documento guardado con éxito!')

  } catch (err) {
    console.error('Error:', err)
  }
}

seedEmpresas()
