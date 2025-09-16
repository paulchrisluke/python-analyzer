import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
  centered?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8"
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  className,
  centered = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <RefreshCw className={cn("animate-spin", sizeClasses[size], className)} />
  )

  if (!text) {
    return spinner
  }

  const content = (
    <div className="flex items-center gap-2">
      {spinner}
      <span className="text-muted-foreground">{text}</span>
    </div>
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {spinner}
          {text && <p className="text-muted-foreground mt-4">{text}</p>}
        </div>
      </div>
    )
  }

  return content
}
