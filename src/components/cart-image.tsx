"use client"

import { useId } from "react"

interface CartImageProps {
  count?: number // Allows you to change the number of images easily (e.g., <CartImage count={5} />)
}

export function CartImage({ count = 3 }: CartImageProps) {
  const id = useId()
  const baseSeed = id.split(":").reduce((a, b) => a + b.charCodeAt(0), 0)

  // Create an array with 'count' elements to map over
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        // Create a unique seed for each specific image using the index
        const seed = baseSeed + index * 143
        
        const top = 10 + (seed % 65) // Increased range so they spread out more vertically
        const side = (seed + index) % 2 === 0 ? "left" : "right"
        const offset = 5 + (seed * 7) % 35 // Increased range for better horizontal scattering

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
              width: "clamp(100px, 15vw, 220px)", // Slightly smaller so multiple images don't clutter
              opacity: 0.3,
              zIndex: -10, // Keeps them safely behind your main text/content
            }}
          />
        )
      })}
    </>
  )
}