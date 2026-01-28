import { type SchemaTypeDefinition } from 'sanity'
import { header } from './header'
import { footer } from './footer'
import { maxGlobalSettings } from './globalSettings'
import { homePage } from './homePage'
import { store } from './store'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [header, footer, maxGlobalSettings, homePage, store],
}

