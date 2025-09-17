import React from "react";

/**
 * VideoHero – video de fondo estilo hero
 * - Ocupa todo el ancho y alto definido
 * - YouTube embed sin controles, en loop, muteado siempre
 * - Params: autoplay, loop, mute, sin controles
 *
 * Props:
 * - videoId: string (ID del video en YouTube, ej: "abcd1234")
 * - height?: string (tailwind classes para altura, ej: "h-[80vh]" o "h-screen")
 */
export default function VideoHero({ videoId = "sChZ-IOIWOA", height = "h-[80vh]" }) {
  console.log("VideoSection render", videoId);
  return (
    <section className={`relative w-full overflow-hidden ${height}`}>
      {/* 
      <div className="absolute inset-0">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&showinfo=0&rel=0`}
          title="Video Bicicletas"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full object-cover"
        ></iframe>
      </div>
       */}

      {/* Overlay oscuro opcional para contraste */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Texto encima (opcional) */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <h2 className="text-4xl font-bold text-white drop-shadow-lg">
          Samurai Video
        </h2>
      </div>
    </section>
  );
}
