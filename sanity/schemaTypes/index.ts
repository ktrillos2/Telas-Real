import { type SchemaTypeDefinition } from 'sanity'
import { header } from './header'
import { footer } from './footer'
import { maxGlobalSettings } from './globalSettings'
import { store } from './store'
import { homeBanners } from './homeBanners'
import { homeConocenos } from './homeConocenos'
import { homeServices } from './homeServices'
import { personalizadoHero } from './personalizadoHero'
import { personalizadoFeatures } from './personalizadoFeatures'
import { personalizadoInfo } from './personalizadoInfo'
import { personalizadoRequirements } from './personalizadoRequirements'
import { personalizadoCTA } from './personalizadoCTA'
import { product } from './product'
import { category } from './category'
import { post } from './post'
import { blockContent } from './blockContent'
import { user } from './user'
import { order } from './order'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [header, footer, maxGlobalSettings, store, homeBanners, homeConocenos, homeServices, personalizadoHero, personalizadoFeatures, personalizadoInfo, personalizadoRequirements, personalizadoCTA, product, category, post, blockContent, user, order],
}

