import { Shield } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  // SVG logo based on the iconography card
  const BoomerBuddyLogo = () => (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Shield background */}
        <path
          d="M50 5 L85 20 L85 50 C85 70 50 95 50 95 C50 95 15 70 15 50 L15 20 Z"
          fill="#1F748C"
          stroke="#17948E"
          strokeWidth="2"
        />
        
        {/* Inner shield */}
        <path
          d="M50 15 L75 25 L75 45 C75 60 50 80 50 80 C50 80 25 60 25 45 L25 25 Z"
          fill="#17948E"
        />
        
        {/* Person 1 (with glasses) */}
        <circle cx="40" cy="35" r="6" fill="white" />
        <rect x="37" y="32" width="6" height="6" rx="3" fill="none" stroke="#17948E" strokeWidth="1.5" />
        <circle cx="38.5" cy="34.5" r="1.5" fill="none" stroke="#17948E" strokeWidth="1" />
        <circle cx="41.5" cy="34.5" r="1.5" fill="none" stroke="#17948E" strokeWidth="1" />
        <path d="M32 50 C32 45 35 42 40 42 C45 42 48 45 48 50 L48 65 L32 65 Z" fill="white" />
        
        {/* Person 2 */}
        <circle cx="60" cy="35" r="6" fill="white" />
        <circle cx="58" cy="33" r="1" fill="#17948E" />
        <circle cx="62" cy="33" r="1" fill="#17948E" />
        <path d="M59 38 C59.5 38.5 60.5 38.5 61 38" stroke="#17948E" strokeWidth="1" fill="none" />
        <path d="M52 50 C52 45 55 42 60 42 C65 42 68 45 68 50 L68 65 L52 65 Z" fill="white" />
      </svg>
    </div>
  );

  if (!showText) {
    return <BoomerBuddyLogo />;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <BoomerBuddyLogo />
      <div className="flex flex-col">
        <h1 className={`font-bold text-boomer-navy ${textSizeClasses[size]} leading-tight`}>
          Boomer Buddy
        </h1>
        {size !== "sm" && (
          <p className="text-boomer-teal text-sm font-medium -mt-1">
            We watch out for you
          </p>
        )}
      </div>
    </div>
  );
}