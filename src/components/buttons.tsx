"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  isLoading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  isLoading = false,
  children,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-[#D7ED4B] text-[#17201D] hover:bg-[#91A91C] hover:text-[#F5F5F0] shadow-sm";
      case "secondary":
        return "bg-[#1D2925] text-[#F5F5F0] hover:bg-[#17201D] border border-[#DFE3DD]/20";
      case "outline":
        return "bg-transparent border border-[#DFE3DD] text-[#17201D] hover:bg-[#E7EDE2]";
      case "danger":
        return "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30";
      default:
        return "bg-[#D7ED4B] text-[#17201D] hover:bg-[#91A91C]";
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#D7ED4B]/50 disabled:cursor-not-allowed disabled:opacity-50 gap-2 ${getVariantStyles()} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
