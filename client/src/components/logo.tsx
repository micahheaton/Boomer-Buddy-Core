import boomerBuddyLogo from "../assets/boomer-buddy-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  const logoOnlySizes = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-12 w-auto"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={boomerBuddyLogo} 
        alt="Boomer Buddy - We Watch Out for You" 
        className={showText ? sizes[size] : logoOnlySizes[size]}
      />
    </div>
  );
}