"use client"

import { useId } from "react"

interface CartImageProps {
  count?: number
}

export function CartImage({ count = 3 }: CartImageProps) {
  const id = useId()
  const baseSeed = id.split(":").reduce((a, b) => a + b.charCodeAt(0), 0)

  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const seed = baseSeed + index * 143
        const top = 10 + (seed % 65)
        const side = (seed + index) % 2 === 0 ? "left" : "right"
        const offset = 5 + (seed * 7) % 35

        return (
          <img
            key={index}
            src="/cart.webp"
            alt=""
            className="pointer-events-none select-none"
            style={{
              position: "fixed",
              [side]: `${offset}%`,
              top: `${top}%`,
              width: "clamp(100px, 15vw, 220px)",
              opacity: 0.3,
              zIndex: -10,
            }}
          />
        )
      })}
    </>
  )
}
