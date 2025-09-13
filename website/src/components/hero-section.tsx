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
            
            {/* 3x2 Gallery Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                "51af2538-9921-4866-4aee-ba627c176c00", // Image 1
                "a35e0610-e53b-47aa-10f9-a0fb4af93000", // Image 2
                "2c0dfb90-4471-4a60-1103-111b1086c100", // Image 3
                "d914038e-b062-44e5-6ec1-e1494d790300", // Image 4
                "f408b92c-3e3a-4826-f63b-49763e913d00", // Image 5
                "3700bc2f-a475-4034-dc0a-fadb5ec56a00", // Image 6
              ].map((imageId, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden"
                >
                  {imageId ? (
                    <img 
                      src={`https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/${imageId}/public`}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs font-medium">
                        {index + 1}
                      </span>
                    </div>
                  )}
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
