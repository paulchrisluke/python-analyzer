"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbNavigationProps {
  path: string[]
  onPathClick: (index: number) => void
}

export function BreadcrumbNavigation({ path, onPathClick }: BreadcrumbNavigationProps) {
  return (
    <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
      <Home className="h-4 w-4 text-muted-foreground" />
      {path.map((segment, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Button
            variant={index === path.length - 1 ? "default" : "ghost"}
            size="sm"
            onClick={() => onPathClick(index)}
            className={index === path.length - 1 ? "font-semibold" : ""}
          >
            {segment}
          </Button>
        </div>
      ))}
    </div>
  )
}
