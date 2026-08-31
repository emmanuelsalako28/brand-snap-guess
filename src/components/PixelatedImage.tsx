import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PixelatedImageProps {
  src: string;
  alt: string;
  isPixelated?: boolean;
  pixelSize?: number;
  className?: string;
}

export const PixelatedImage: React.FC<PixelatedImageProps> = ({
  src,
  alt,
  isPixelated = true,
  pixelSize = 18,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageObj(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    const handleLoad = () => {
      setIsLoading(false);
      setImageObj(img);
    };

    const handleError = () => {
      // Fallback without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.src = src;
      fallbackImg.onload = () => {
        setIsLoading(false);
        setImageObj(fallbackImg);
      };
      fallbackImg.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
    };

    img.onload = handleLoad;
    img.onerror = handleError;
  }, [src]);

  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 300;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = width;
    const h = height;

    ctx.clearRect(0, 0, w, h);

    // Calculate aspect ratio fit (object-contain)
    const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
    const canvasAspect = w / h;
    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > canvasAspect) {
      renderH = w / imgAspect;
      offsetY = (h - renderH) / 2;
    } else {
      renderW = h * imgAspect;
      offsetX = (w - renderW) / 2;
    }

    if (!isPixelated) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(imageObj, offsetX, offsetY, renderW, renderH);
      return;
    }

    // Create low-res offscreen canvas for pixelation
    const offscreen = document.createElement("canvas");
    const tinyW = Math.max(4, Math.floor(renderW / pixelSize));
    const tinyH = Math.max(4, Math.floor(renderH / pixelSize));
    offscreen.width = tinyW;
    offscreen.height = tinyH;
    const offCtx = offscreen.getContext("2d");

    if (offCtx) {
      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(imageObj, 0, 0, tinyW, tinyH);

      ctx.imageSmoothingEnabled = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).webkitImageSmoothingEnabled = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).mozImageSmoothingEnabled = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).msImageSmoothingEnabled = false;

      ctx.drawImage(offscreen, 0, 0, tinyW, tinyH, offsetX, offsetY, renderW, renderH);
    }
  }, [imageObj, isPixelated, pixelSize]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-jumia" />
        </div>
      )}

      {hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded"
        />
      ) : (
        <>
          {/* Canvas for pixelated mode */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain transition-opacity duration-500 ${
              isPixelated ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          />
          {/* Clear image tag for revealed state */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-contain transition-opacity duration-500 ${
              !isPixelated ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
          />
        </>
      )}
    </div>
  );
};
