"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX, Play, ShoppingBag, VideoOff, Heart, X, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface VideoProps {
    id: string
    title: string
    description: string
    videoUrl: string
    thumbnailUrl?: string
    likes?: number
    relatedProduct?: {
        name: string
        slug: string
        price: number
        salePrice?: number
        image: string
    }
}

function MobileVideoStack({ videos, onSelect }: { videos: VideoProps[], onSelect: (v: VideoProps) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -60 && currentIndex < videos.length - 1) {
            setCurrentIndex(c => c + 1)
        } else if (info.offset.x > 60 && currentIndex > 0) {
            setCurrentIndex(c => c - 1)
        }
    }

    return (
        <div className="relative w-full h-[65vh] min-h-[480px] max-h-[600px] flex items-center justify-center overflow-hidden perspective-[1000px]">
            <div className="absolute top-2 sm:top-6 left-0 right-0 text-center z-20 pointer-events-none">
                <p className="text-white/50 text-xs font-medium tracking-widest uppercase">Desliza para explorar</p>
            </div>
            
            {videos.map((video, index) => {
                const offset = index - currentIndex
                
                // Solo renderizamos la actual, dos adelante y la que acaba de salir (atrás)
                if (offset < -1 || offset > 2) return null

                const isCurrent = offset === 0

                return (
                    <motion.div
                        key={video.id || index}
                        className="absolute w-[280px] h-[450px] sm:w-[320px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800"
                        animate={{
                            scale: offset < 0 ? 0.9 : 1 - offset * 0.08,
                            y: offset < 0 ? 0 : offset * 25,
                            x: offset < 0 ? -400 : 0,
                            opacity: offset < 0 ? 0 : 1 - offset * 0.3,
                            zIndex: 10 - Math.abs(offset),
                            rotate: offset < 0 ? -15 : 0
                        }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                        drag={isCurrent ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={isCurrent ? handleDragEnd : undefined}
                        onClick={() => isCurrent && onSelect(video)}
                        style={{ cursor: isCurrent ? 'grab' : 'auto' }}
                        whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
                    >
                        {video.thumbnailUrl ? (
                            <Image 
                                src={video.thumbnailUrl} 
                                alt={video.title} 
                                fill 
                                className="object-cover pointer-events-none" 
                            />
                        ) : (
                            <video src={video.videoUrl} className="w-full h-full object-cover pointer-events-none" muted playsInline />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
                            <h3 className="text-white font-bold line-clamp-2 text-xl drop-shadow-md">{video.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Heart className="w-4 h-4 text-white/80" />
                                <span className="text-white/80 text-sm">{video.likes || 0}</span>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

export function VideoFeed({ videos }: { videos: VideoProps[] }) {
    const [selectedVideo, setSelectedVideo] = useState<VideoProps | null>(null)
    const [muted, setMuted] = useState(true)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = window.innerWidth >= 640 ? 336 : 296 // width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <>
            {/* VISTA DESKTOP: Carrusel Horizontal con Flechas */}
            <div className="hidden lg:block relative w-full max-w-7xl mx-auto group/carousel">
                <button 
                    onClick={() => scroll('left')}
                    className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-xl"
                    aria-label="Anterior"
                >
                    <ChevronLeft className="w-6 h-6 mr-1" />
                </button>

                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
                >
                    {videos.map((video, index) => (
                        <div 
                            key={video.id || index} 
                            onClick={() => setSelectedVideo(video)}
                            className="relative w-[280px] h-[450px] sm:w-[320px] sm:h-[520px] flex-shrink-0 snap-start snap-always rounded-xl overflow-hidden cursor-pointer group bg-zinc-900 border border-zinc-800 transition-transform duration-300 hover:scale-[1.02]"
                        >
                            {video.thumbnailUrl ? (
                                <Image 
                                    src={video.thumbnailUrl} 
                                    alt={video.title} 
                                    fill 
                                    className="object-cover" 
                                />
                            ) : (
                                <video src={video.videoUrl} className="w-full h-full object-cover" muted playsInline />
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                <h3 className="text-white font-bold line-clamp-2 text-lg drop-shadow-md">{video.title}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Heart className="w-4 h-4 text-white/80" />
                                    <span className="text-white/80 text-sm">{video.likes || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => scroll('right')}
                    className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity shadow-xl"
                    aria-label="Siguiente"
                >
                    <ChevronRight className="w-6 h-6 ml-1" />
                </button>
            </div>

            {/* VISTA MÓVIL: Tarjetas 3D Apiladas */}
            <div className="block lg:hidden w-full">
                <MobileVideoStack videos={videos} onSelect={setSelectedVideo} />
            </div>

            {selectedVideo && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <button 
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-6 right-6 z-[110] p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full h-[100dvh] max-w-[450px] mx-auto relative overflow-hidden">
                        <VideoItem 
                            video={selectedVideo} 
                            muted={muted} 
                            setMuted={setMuted} 
                        />
                    </div>
                </div>
            )}
        </>
    )
}

function VideoItem({ video, muted, setMuted }: { video: VideoProps, muted: boolean, setMuted: (m: boolean) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [likesCount, setLikesCount] = useState(video.likes || 0)
    const [hasLiked, setHasLiked] = useState(false)

    useEffect(() => {
        try {
            const likedVideos = JSON.parse(localStorage.getItem('liked_videos') || '[]')
            if (likedVideos.includes(video.id)) {
                setHasLiked(true)
            }
        } catch (e) {
            console.error('Error reading liked_videos from localStorage', e)
        }
    }, [video.id])

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasLiked) return

        // Optimistic update
        setHasLiked(true)
        setLikesCount(prev => prev + 1)

        try {
            const likedVideos = JSON.parse(localStorage.getItem('liked_videos') || '[]')
            if (!likedVideos.includes(video.id)) {
                localStorage.setItem('liked_videos', JSON.stringify([...likedVideos, video.id]))
            }

            await fetch('/api/videos/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: video.id }),
            })
        } catch (error) {
            console.error('Failed to like video', error)
            setHasLiked(false)
            setLikesCount(prev => prev - 1)
        }
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => setIsPlaying(false))
                    setIsPlaying(true)
                } else {
                    videoRef.current?.pause()
                    setIsPlaying(false)
                }
            },
            { threshold: 0.6 } // Needs 60% visibility to trigger
        )

        if (videoRef.current) {
            observer.observe(videoRef.current)
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current)
            }
        }
    }, [])

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
                setIsPlaying(false)
            } else {
                videoRef.current.play().catch(() => {})
                setIsPlaying(true)
            }
        }
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        setMuted(!muted)
    }

    return (
        // Cada item tiene altura FIJA = toda la pantalla en móvil, sin importar el padre
        <div className="relative w-full h-[100dvh] lg:h-full snap-start snap-always bg-zinc-900 group cursor-pointer flex-shrink-0" onClick={togglePlay}>
            <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={muted}
            />

            {/* Play Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity duration-300">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-10 h-10 text-white fill-white ml-2" />
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 pb-[72px] lg:pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none flex flex-col justify-end">
                <div className="flex justify-between items-end gap-4 pointer-events-auto">
                    <div className="flex-1 text-white">
                        <h2 className="text-xl font-bold mb-1 line-clamp-2 drop-shadow-md">{video.title}</h2>
                        {video.description && (
                            <p className="text-sm text-white/90 line-clamp-3 mb-4 font-light drop-shadow-md">{video.description}</p>
                        )}

                        {video.relatedProduct && (
                            <Link href={`/producto/${video.relatedProduct.slug}`} className="block w-full max-w-[280px]">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 flex items-center gap-3 hover:bg-white/20 transition-all duration-300 shadow-lg group-hover:border-white/40">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                        <Image
                                            src={video.relatedProduct.image || "/placeholder.svg"}
                                            alt={video.relatedProduct.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate text-white drop-shadow-sm">{video.relatedProduct.name}</p>
                                        <div className="flex items-center gap-2">
                                            {video.relatedProduct.salePrice ? (
                                                <>
                                                    <span className="text-xs font-bold text-white drop-shadow-sm">${video.relatedProduct.salePrice.toLocaleString()}</span>
                                                    <span className="text-[10px] line-through text-white/60">${video.relatedProduct.price.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-white drop-shadow-sm">${video.relatedProduct.price.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white text-black p-2 rounded-full flex-shrink-0 mr-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 pb-2">
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={handleLike}
                                className={`p-3 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center ${hasLiked ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/10 text-white hover:bg-white/30'}`}
                                aria-label="Like"
                            >
                                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                            </button>
                            <span className="text-white text-xs font-semibold drop-shadow-md">{likesCount}</span>
                        </div>

                        <button
                            onClick={toggleMute}
                            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-all shadow-lg"
                            aria-label={muted ? "Unmute" : "Mute"}
                        >
                            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
