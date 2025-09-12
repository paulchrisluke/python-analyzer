"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => {
  // Coerce value to number, default to 0 when NaN/undefined
  const coercedValue = Number(value) || 0
  // Coerce max to number, default to 100 when NaN/undefined
  const coercedMax = Number(max) || 100
  // Clamp value against the provided max
  const clampedValue = Math.max(0, Math.min(coercedMax, coercedValue))
  // Compute indicator percentage as (clampedValue / max) * 100
  const percentage = (clampedValue / coercedMax) * 100
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
