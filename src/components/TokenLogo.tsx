import { useState } from "react";

interface TokenLogoProps {
  symbol: string;
  logoURI?: string;
  icon?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

/**
 * TokenLogo component with fallback support
 * 1. Try to load image from logoURI
 * 2. Fall back to emoji icon
 * 3. Fall back to first letter of symbol
 */
export default function TokenLogo({
  symbol,
  logoURI,
  icon,
  size = "md",
  className = "",
}: TokenLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const showImage = logoURI && !imageError;
  const showIcon = !showImage && icon;
  const showFallback = !showImage && !showIcon;

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 ${className}`}
    >
      {showImage && (
        <>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary animate-pulse">
              <span className="text-muted-foreground">{icon || symbol[0]}</span>
            </div>
          )}
          <img
            src={logoURI}
            alt={symbol}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        </>
      )}
      {showIcon && (
        <span className="font-semibold">{icon}</span>
      )}
      {showFallback && (
        <span className="font-bold text-foreground/80">{symbol[0]}</span>
      )}
    </div>
  );
}
