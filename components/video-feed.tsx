"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX, Play, ShoppingBag, VideoOff, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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

export function VideoFeed({ videos }: { videos: VideoProps[] }) {
    const [muted, setMuted] = useState(true)

    return (
        <div className="h-full w-full max-w-[450px] mx-auto bg-black overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {videos.map((video, index) => (
                <VideoItem
                    key={video.id || index}
                    video={video}
                    muted={muted}
                    setMuted={setMuted}
                />
            ))}
        </div>
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
