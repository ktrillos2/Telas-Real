import type { CSSProperties, ElementType, ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Fraunces } from "next/font/google"
import { stegaClean } from "next-sanity"
import type { BannerFabric, CommercialCollection } from "@/lib/commercial-collections"
import s from "./christmas-banners.module.css"

/**
 * Banners de Navidad de las colecciones (Sanity → Colecciones Comerciales → Banner → "Estilo del banner"):
 * - Muestrario: abanico de retazos de las telas reales unidos con un tornillo de latón.
 * - Guirnalda: banderines cosidos con las telas sobre una foto de luces desenfocadas.
 * - Regalo: el banner envuelto en cuadro búfalo con cinta de satén y etiqueta de cartulina.
 */

// Letra cursiva de la palabra destacada (solo se descarga cuando se usa uno de estos banners)
const fraunces = Fraunces({ subsets: ["latin"], style: ["italic"], axes: ["SOFT", "WONK", "opsz"], display: "swap", preload: false })

type Css = CSSProperties & Record<`--${string}`, string | number>

/** Parte el título en antes / palabra destacada / después. */
export function splitHighlight(rawTitle: string, rawHighlight?: string): [string, string, string] {
  // Sin los caracteres invisibles de la edición visual de Sanity (si no, la palabra no se encuentra)
  const title = stegaClean(rawTitle)
  const highlight = stegaClean(rawHighlight)
  if (!highlight) return [rawTitle, "", ""]
  const i = title.toLowerCase().lastIndexOf(highlight.toLowerCase())
  if (i < 0) return [rawTitle, "", ""]
  return [title.slice(0, i), title.slice(i, i + highlight.length), title.slice(i + highlight.length)]
}

interface Props {
  collection: CommercialCollection
  heading: ElementType
  linkToPage: boolean
}

function Copy({ collection, heading: Heading, linkToPage, eyebrowDefault }: Props & { eyebrowDefault: string }) {
  const [before, hl, after] = splitHighlight(collection.title, collection.highlight)
  const eyebrow = collection.eyebrow ?? eyebrowDefault
  return (
    <>
      {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
      <Heading className={s.title}>
        {before}
        {hl && <em className={fraunces.className}>{hl}</em>}
        {after}
      </Heading>
      {collection.subtitle && <p className={s.sub}>{collection.subtitle}</p>}
      {linkToPage && <ButtonLink collection={collection} />}
    </>
  )
}

function ButtonLink({ collection }: { collection: CommercialCollection }) {
  return (
    <Link href={collection.link} className={s.btn}>
      {collection.buttonText}
      <ArrowRight aria-hidden />
    </Link>
  )
}

const seasonEyebrow = () => `Colección de temporada · ${new Date().getFullYear()}`

/** Ángulos repartidos de forma pareja (abanico simétrico). */
function spread(n: number, step: number, max: number): number[] {
  if (n <= 1) return [0]
  const total = Math.min(max, step * (n - 1))
  return Array.from({ length: n }, (_, i) => Math.round(-total / 2 + (total * i) / (n - 1)))
}

// ── A · Muestrario ─────────────────────────────────────────────────────────────────────────────
export function MuestrarioBanner(props: Props) {
  const fabrics = props.collection.fabrics.slice(0, 9)
  const desk = spread(fabrics.length, 16, 128)
  const mobileCount = Math.min(fabrics.length, 7)
  const mob = spread(mobileCount, 18, 108)
  return (
    <div className={`${s.base} ${s.muestrario}`}>
      <div className={`${s.layer} ${s.bg}`} aria-hidden />
      <div className={s.grain} aria-hidden />
      <div className={s.glow} aria-hidden />
      <div className={s.copyA}>
        <Copy {...props} eyebrowDefault={seasonEyebrow()} />
      </div>
      {fabrics.length > 0 && (
        <div className={s.fanBox}>
          <div className={s.fan}>
            {fabrics.map((f, i) => (
              <FabricLink
                key={f.key}
                fabric={f}
                className={`${s.strip} ${i >= mobileCount ? s.extra : ""}`}
                style={{ "--r": `${desk[i]}deg`, "--rm": `${mob[Math.min(i, mobileCount - 1)]}deg`, "--img": `url("${f.imageUrl}")`, zIndex: i + 1 }}
              >
                <span className={s.fab} />
                <span className={s.ref} aria-hidden>{f.code}</span>
              </FabricLink>
            ))}
            <span className={s.screw} aria-hidden />
          </div>
        </div>
      )}
    </div>
  )
}

function FabricLink({ fabric, className, style, children }: { fabric: BannerFabric; className: string; style: Css; children: ReactNode }) {
  return (
    <Link href={fabric.href} className={className} style={style} aria-label={fabric.code ? `Ver la tela ${fabric.code}` : "Ver la tela"}>
      {children}
    </Link>
  )
}

// ── B · Guirnalda ──────────────────────────────────────────────────────────────────────────────
interface CordShape { count: number; width: number; y0: number; sag: number; w: number; h: number }
const DESK_CORD: CordShape = { count: 13, width: 1300, y0: 8, sag: 38, w: 82, h: 102 }
const MOB_CORD: CordShape = { count: 6, width: 360, y0: 6, sag: 26, w: 58, h: 72 }

/** Luces desenfocadas fijas (mismas posiciones en cada visita), más hacia la derecha donde no hay texto. */
const BOKEH = (() => {
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 34 }, (_, i) => {
    const size = 8 + Math.pow(rnd(), 2) * 54
    const x = i < 14 ? rnd() * 100 : 35 + Math.pow(rnd(), 0.7) * 65
    const y = i < 14 ? rnd() * 55 : rnd() * 100
    const c = rnd() < 0.72 ? "rgba(255,206,120,.9)" : rnd() < 0.5 ? "rgba(255,120,90,.85)" : "rgba(255,245,220,.9)"
    return { size: Math.round(size), x: x.toFixed(1), y: y.toFixed(1), c, o: (0.18 + rnd() * 0.45).toFixed(2) }
  })
})()

function Bunting({ fabrics, shape, className }: { fabrics: BannerFabric[]; shape: CordShape; className: string }) {
  const { count, width, y0, sag, w, h } = shape
  const yAt = (t: number) => y0 + 4 * sag * t * (1 - t)
  return (
    <>
      <svg className={`${s.cord} ${className}`} viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden>
        {[
          { stroke: "rgba(0,0,0,.35)", w: 3, dy: 2 },
          { stroke: "#d8c39c", w: 2.2, dy: 0 },
          { stroke: "#8c7350", w: 2.2, dy: 0, dash: "2 3", o: 0.7 },
        ].map((l, i) => (
          <path
            key={i}
            d={`M0 ${y0 + l.dy} Q500 ${y0 + 2 * sag + l.dy} 1000 ${y0 + l.dy}`}
            fill="none"
            stroke={l.stroke}
            strokeWidth={l.w}
            strokeDasharray={l.dash}
            opacity={l.o}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className={`${s.flags} ${className}`}>
        {Array.from({ length: count }, (_, i) => {
          const f = fabrics[i % fabrics.length]
          const t = (i + 0.5) / count
          const ang = (Math.atan((4 * sag * (1 - 2 * t)) / width) * 180) / Math.PI * 0.85 + (i % 2 ? 1.5 : -1.5)
          const ix = 9
          return (
            <span key={i} className={s.flag} style={{ left: `${(t * 100).toFixed(2)}%`, top: `${yAt(t).toFixed(1)}px`, "--a": `${ang.toFixed(2)}deg` } as Css}>
              <span className={s.sway} style={{ "--d": `${(-(i * 0.7) % 5).toFixed(2)}s` } as Css}>
                <FabricLink fabric={f} className={s.flagLink} style={{ "--w": `${w}px`, "--h": `${h}px`, "--img": `url("${f.imageUrl}")` }}>
                  <span className={s.flagBody} />
                  <svg className={s.stitch} viewBox={`0 0 ${w} ${h}`} aria-hidden>
                    <polygon
                      points={`${ix},${ix} ${w - ix},${ix} ${w / 2},${h - 16}`}
                      fill="none"
                      stroke="rgba(255,248,230,.85)"
                      strokeWidth="1.3"
                      strokeDasharray="4 3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </FabricLink>
              </span>
            </span>
          )
        })}
      </div>
    </>
  )
}

export function GuirnaldaBanner(props: Props) {
  const fabrics = props.collection.fabrics
  return (
    <div className={`${s.base} ${s.guirnalda}`}>
      <div className={`${s.layer} ${s.photo}`} aria-hidden />
      <div className={`${s.layer} ${s.shade}`} aria-hidden />
      <div className={`${s.layer} ${s.bokeh}`} aria-hidden>
        {BOKEH.map((b, i) => (
          <i key={i} style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size, "--c": b.c, "--o": b.o } as Css} />
        ))}
      </div>
      <div className={s.grain} aria-hidden />
      {fabrics.length > 0 && (
        <>
          <Bunting fabrics={fabrics} shape={DESK_CORD} className={s.desktopOnly} />
          <Bunting fabrics={fabrics} shape={MOB_CORD} className={s.mobileOnly} />
        </>
      )}
      <div className={s.rowB}>
        <div>
          <Copy {...props} linkToPage={false} eyebrowDefault={seasonEyebrow()} />
        </div>
        {props.linkToPage && <ButtonLink collection={props.collection} />}
      </div>
    </div>
  )
}

// ── C · Regalo ─────────────────────────────────────────────────────────────────────────────────
export function RegaloBanner(props: Props) {
  return (
    <div className={`${s.base} ${s.regalo}`}>
      <div className={`${s.layer} ${s.fabric}`} aria-hidden />
      <div className={`${s.layer} ${s.weave}`} aria-hidden />
      <div className={s.grain} aria-hidden />
      <div className={`${s.layer} ${s.light}`} aria-hidden />
      <div className={s.ribH} aria-hidden />
      <div className={s.ribV} aria-hidden />
      <div className={s.tag}>
        <span className={s.frame} aria-hidden />
        <span className={s.hole} aria-hidden />
        <svg className={s.twine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {[
            { stroke: "rgba(0,0,0,.35)", w: 3.2, dx: 1, dy: 3 },
            { stroke: "#dcc7a1", w: 2.4, dx: 0, dy: 0 },
            { stroke: "#8c7350", w: 2.4, dx: 0, dy: 0, dash: "2 3", o: 0.75 },
          ].map((l, i) => (
            <path
              key={i}
              d="M0 100 Q 45 128 100 0"
              transform={l.dx || l.dy ? `translate(${l.dx} ${l.dy})` : undefined}
              fill="none"
              stroke={l.stroke}
              strokeWidth={l.w}
              strokeDasharray={l.dash}
              strokeLinecap="round"
              opacity={l.o}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <span className={s.knot} aria-hidden />
        <Copy {...props} eyebrowDefault="Para ti · de Telas Real" />
      </div>
    </div>
  )
}
