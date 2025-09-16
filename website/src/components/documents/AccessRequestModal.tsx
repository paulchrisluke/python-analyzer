"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Mail, User, Building } from "lucide-react"

interface AccessRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onRequestAccess: () => void
  folderName: string
}

export function AccessRequestModal({ isOpen, onClose, onRequestAccess, folderName }: AccessRequestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    reason: '',
    phone: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement access request submission
    console.log('Access request submitted:', { folderName, ...formData })
    onRequestAccess()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Request Document Access</DialogTitle>
          </div>
          <DialogDescription>
            You need permission to access the &quot;{folderName}&quot; folder. Please provide your information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="pl-10"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                placeholder="john@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="pl-10"
                placeholder="Acme Corporation"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Your Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Potential Buyer</SelectItem>
                <SelectItem value="advisor">Financial Advisor</SelectItem>
                <SelectItem value="lawyer">Legal Counsel</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Access *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please explain why you need access to these documents..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Request Access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
