"use client"

import { ContactForm } from "./contact-form";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
}

export function HeroSection({ title, subtitle, imageUrl, imageAlt }: HeroSectionProps) {
  return (
    <div className="px-4 lg:px-6">
      <div className="text-left mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          {subtitle}
        </p>
        
        {/* Side by side layout: Image and Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Image and Placeholder Grid */}
          <div className="w-full space-y-6">
            {/* Professional Practice Image */}
            <div className="w-full">
              <img 
                src={imageUrl} 
                alt={imageAlt}
                className="w-full h-auto rounded-lg shadow-lg object-cover"
              />
            </div>
            
            {/* 3x2 Placeholder Grid */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                >
                  <span className="text-gray-400 text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column: Contact Form */}
          <div className="w-full">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
