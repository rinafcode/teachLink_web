"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
}

export function Logo({ size = "md" }: LogoProps) {
  const [error, setError] = useState(false)
  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
  }

  const { width, height } = dimensions[size]

  if (error) {
    return (
      <Link href="/" className="inline-block">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl">TeachLink</span>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/" className="inline-block">
      <Image
        src="/teachlink-logo.png"
        alt="TeachLink Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
        onError={() => setError(true)}
      />
    </Link>
  )
} 