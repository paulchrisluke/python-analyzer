"use client"

import { FolderItem } from "./FolderView"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Eye, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface FolderGridProps {
  items: FolderItem[]
  selectedItems: Set<string>
  onItemClick: (item: FolderItem) => void
  onItemSelect: (itemId: string, selected: boolean) => void
  onPreview: (item: FolderItem) => void
  onDownload: (item: FolderItem) => void
  userRole: string
  viewMode: 'grid' | 'list'
}

export function FolderGrid({ items, selectedItems, onItemClick, onItemSelect, onPreview, onDownload, userRole, viewMode }: FolderGridProps) {

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-lg font-medium">No items found</h3>
        <p className="text-sm">This folder is empty</p>
      </div>
    )
  }

  return (
    <div className={cn(
      viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        : "space-y-2"
    )}>
        {items.map((item) => {
          const isSelected = selectedItems.has(item.id)
          const IconComponent = item.icon
          
          return (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected && "ring-2 ring-primary",
                item.isLocked && "opacity-60"
              )}
              onClick={() => onItemClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon on the left */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                    {item.isLocked && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Content in the middle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate" title={item.name}>
                          {item.name}
                        </h3>
                        
                        {item.itemCount !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                          </p>
                        )}
                        
                        {item.type === 'document' && item.document && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.document.file_size_display}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.document.file_type.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Checkbox for documents only */}
                      {item.type === 'document' && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            onItemSelect(item.id, checked as boolean)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-2 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                  
                  {item.type === 'document' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onPreview(item)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(item)
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
