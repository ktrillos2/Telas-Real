import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'

export async function SanityLive() {
  const dMode = await draftMode()
  if (dMode.isEnabled) {
    return <VisualEditing />
  }
  return null
}
