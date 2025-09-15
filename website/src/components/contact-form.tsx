"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Mock API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log submission without PII
      console.log("Contact form submitted successfully");
      
      setIsSubmitted(true);
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        agreeToTerms: false,
      });
    } catch (error) {
      console.error("Form submission error:", error);
      // Could add error state here if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Get More Information</CardTitle>
        <CardDescription>
          Interested in this audiology practice? Contact us for a confidential discussion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank you for your interest!</h3>
            <p className="text-muted-foreground">
              We&apos;ll be in touch soon with more information about this business opportunity.
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline" 
              className="mt-4"
            >
              Send Another Message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us about your interest in this practice..."
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to receive communications about this business opportunity
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || !formData.agreeToTerms}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sending...
                </>
              ) : (
                "Request Information"
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>info@cranberryhearing.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>(724) 779-1234</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Cranberry Township, PA</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
