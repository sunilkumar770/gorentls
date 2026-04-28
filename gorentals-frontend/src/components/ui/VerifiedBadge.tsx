"use client";

import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({ 
  showText = false, 
  size = "md",
  className = "" 
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const containerClasses = {
    sm: "px-1 py-0.5 gap-0.5",
    md: "px-1.5 py-0.5 gap-1",
    lg: "px-2.5 py-1 gap-1.5"
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 ${containerClasses[size]} ${className}`}
      title="Verified Identity & Documentation"
    >
      <ShieldCheck className={`${sizeClasses[size]} fill-teal-600/10`} />
      {showText && (
        <span className={`font-bold uppercase tracking-wider ${size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[10px]'}`}>
          Verified
        </span>
      )}
    </div>
  );
}
