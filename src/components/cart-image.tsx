"use client"

import { useId } from "react"

export function CartImage() {
  const id = useId()

  const seed = id.split(":").reduce((a, b) => a + b.charCodeAt(0), 0)
  const top = 10 + (seed % 35)
  const side = seed % 2 === 0 ? "left" : "right"
  const offset = 5 + (seed * 7) % 25

  return (
    <img
      src="/cart.png"
      alt=""
      className="pointer-events-none select-none"
      style={{
        position: "fixed",
        [side]: `${offset}%`,
        top: `${top}%`,
        width: "clamp(120px, 18vw, 260px)",
        opacity: 0.08,
      }}
    />
  )
}
