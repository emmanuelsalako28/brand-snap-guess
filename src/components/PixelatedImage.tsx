import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface PixelatedImageProps {
  src: string;
  alt: string;
  isPixelated?: boolean;
  blurSize?: number;
  className?: string;
}

export const PixelatedImage: React.FC<PixelatedImageProps> = ({
  src,
  alt,
  isPixelated = true,
  blurSize = 3,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg z-10">
          <Loader2 className="w-8 h-8 animate-spin text-jumia" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        style={{
          filter: isPixelated ? `blur(${blurSize}px) brightness(1.05)` : "blur(0px) brightness(1)",
        }}
        className="w-full h-full object-contain rounded transition-all duration-700 ease-out"
      />
    </div>
  );
};
