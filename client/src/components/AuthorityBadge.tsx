import { Badge } from "@/components/ui/badge";
import { Shield, Building, Heart } from "lucide-react";

interface AuthorityBadgeProps {
  authority: 'federal' | 'state' | 'nonprofit';
  agency?: string;
}

export function AuthorityBadge({ authority, agency }: AuthorityBadgeProps) {
  const getBadgeStyles = () => {
    switch (authority) {
      case 'federal':
        return {
          className: 'bg-blue-100 text-blue-800 border-blue-200 font-medium',
          icon: <Shield className="w-3 h-3 mr-1" />,
          label: 'Federal .gov'
        };
      case 'state':
        return {
          className: 'bg-green-100 text-green-800 border-green-200 font-medium',
          icon: <Building className="w-3 h-3 mr-1" />,
          label: 'State .gov'
        };
      case 'nonprofit':
        return {
          className: 'bg-purple-100 text-purple-800 border-purple-200 font-medium',
          icon: <Heart className="w-3 h-3 mr-1" />,
          label: 'Trusted Nonprofit'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Shield className="w-3 h-3 mr-1" />,
          label: 'Verified'
        };
    }
  };

  const { className, icon, label } = getBadgeStyles();

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={className}>
        {icon}
        {label}
      </Badge>
      {agency && (
        <span className="text-xs text-gray-600 font-medium">
          {agency}
        </span>
      )}
    </div>
  );
}