import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils';

// Professional, clean icons inspired by modern Flaticon-style design
interface IconWrapperProps {
  className?: string;
  children: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  size?: string;
}

const IconWrapper = ({ className, children, bgColor = "#f9fafb", iconColor = "#374151", size = "w-6 h-6" }: IconWrapperProps) => (
  <div className={cn(`inline-flex items-center justify-center ${size} rounded-full border-2 shadow-sm`, className)} style={{ backgroundColor: bgColor, borderColor: iconColor }}>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={iconColor}
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </div>
);

// Dietary preferences (colored)
export const VegetarianIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f0fdf4" iconColor="#16a34a" size="w-6 h-6" {...props}>
    <path d="M12 2c-2 0-4 1-5 3-1 2-1 4 0 6l5 5 5-5c1-2 1-4 0-6-1-2-3-3-5-3z" fill="#16a34a" stroke="none"/>
    <path d="M12 8l-2 2 2 2 2-2-2-2z" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

export const VeganIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f0fdf4" iconColor="#15803d" size="w-6 h-6" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="#15803d" strokeWidth="2"/>
    <path d="M8 12l2 2 4-4" fill="none" stroke="#15803d" strokeWidth="2"/>
  </IconWrapper>
);

export const SpicyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#fef2f2" iconColor="#dc2626" size="w-6 h-6" {...props}>
    <path d="M10 2c-1 0-2 1-2 2v8c0 2 2 4 4 4s4-2 4-4V4c0-1-1-2-2-2h-4z" fill="#dc2626" stroke="none"/>
    <path d="M12 6c1 0 2 1 2 2v4c0 1-1 2-2 2s-2-1-2-2V8c0-1 1-2 2-2z" fill="#ffffff" stroke="none"/>
    <circle cx="16" cy="6" r="1" fill="#dc2626" stroke="none"/>
  </IconWrapper>
);

// Black and white allergens/ingredients
export const HalalIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="#374151" strokeWidth="2"/>
    <text x="12" y="16" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="bold">H</text>
  </IconWrapper>
);

export const FishIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M2 12c0 0 4-6 10-6s10 6 10 6-4 6-10 6-10-6-10-6z" fill="#374151" stroke="none"/>
    <circle cx="15" cy="10" r="1.5" fill="#ffffff" stroke="none"/>
    <path d="M22 11l2-1v2l-2-1z" fill="#374151" stroke="none"/>
  </IconWrapper>
);

export const EggsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <ellipse cx="12" cy="12" rx="5" ry="8" fill="#374151" stroke="none"/>
    <ellipse cx="12" cy="10" rx="3" ry="5" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

export const NutsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 4c-3 0-6 2-6 6 0 2 1 4 3 5l3 3 3-3c2-1 3-3 3-5 0-4-3-6-6-6z" fill="#374151" stroke="none"/>
    <ellipse cx="12" cy="10" rx="2" ry="3" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

export const DairyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M8 4h8c1 0 2 1 2 2v12c0 1-1 2-2 2H8c-1 0-2-1-2-2V6c0-1 1-2 2-2z" fill="#374151" stroke="none"/>
    <circle cx="12" cy="2" r="1.5" fill="#374151" stroke="none"/>
    <rect x="10" y="8" width="4" height="6" rx="1" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

export const WheatIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20V4" stroke="#374151" strokeWidth="2"/>
    <path d="M8 6l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <path d="M8 10l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <path d="M8 14l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <circle cx="12" cy="20" r="2" fill="#374151" stroke="none"/>
  </IconWrapper>
);

export const CrustaceansIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <ellipse cx="12" cy="16" rx="8" ry="3" fill="#374151" stroke="none"/>
    <path d="M12 13V7" stroke="#374151" strokeWidth="2"/>
    <path d="M6 9l-2-2M18 9l2-2" stroke="#374151" strokeWidth="1.5"/>
    <circle cx="9" cy="7" r="1" fill="#374151" stroke="none"/>
    <circle cx="15" cy="7" r="1" fill="#374151" stroke="none"/>
    <path d="M9 10l3-3 3 3" stroke="#374151" strokeWidth="1"/>
  </IconWrapper>
);

export const CeleryIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20V8" stroke="#374151" strokeWidth="3"/>
    <path d="M8 12l4-4 4 4" stroke="#374151" strokeWidth="2"/>
    <path d="M10 8V5M14 8V5" stroke="#374151" strokeWidth="2"/>
    <path d="M12 5V2" stroke="#374151" strokeWidth="2"/>
    <circle cx="10" cy="5" r="0.5" fill="#374151" stroke="none"/>
    <circle cx="14" cy="5" r="0.5" fill="#374151" stroke="none"/>
  </IconWrapper>
);

export const MustardIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20c-2 0-4-3-4-6s2-6 4-6 4 3 4 6-2 6-4 6z" fill="#374151" stroke="none"/>
    <ellipse cx="12" cy="6" rx="3" ry="2" fill="#374151" stroke="none"/>
    <circle cx="12" cy="14" r="1.5" fill="#ffffff" stroke="none"/>
    <path d="M10 4h4" stroke="#374151" strokeWidth="1"/>
  </IconWrapper>
);

export const SoyaIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <circle cx="9" cy="10" r="3" fill="#374151" stroke="none"/>
    <circle cx="15" cy="10" r="3" fill="#374151" stroke="none"/>
    <ellipse cx="12" cy="16" rx="4" ry="2" fill="#374151" stroke="none"/>
    <circle cx="9" cy="10" r="1" fill="#ffffff" stroke="none"/>
    <circle cx="15" cy="10" r="1" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

export const CinnamonIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M4 8h16c1 0 2 1 2 2v4c0 1-1 2-2 2H4c-1 0-2-1-2-2v-4c0-1 1-2 2-2z" fill="#374151" stroke="none"/>
    <rect x="6" y="10" width="12" height="1" fill="#ffffff" stroke="none"/>
    <rect x="6" y="12" width="12" height="1" fill="#ffffff" stroke="none"/>
    <rect x="6" y="14" width="12" height="1" fill="#ffffff" stroke="none"/>
  </IconWrapper>
);

// Free versions with red cross
export const NutFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 4c-3 0-6 2-6 6 0 2 1 4 3 5l3 3 3-3c2-1 3-3 3-5 0-4-3-6-6-6z" fill="#374151" stroke="none"/>
    <ellipse cx="12" cy="10" rx="2" ry="3" fill="#ffffff" stroke="none"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="#dc2626" strokeWidth="3"/>
  </IconWrapper>
);

export const GlutenFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20V4" stroke="#374151" strokeWidth="3"/>
    <path d="M8 6l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <path d="M8 10l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <path d="M8 14l4-2 4 2" stroke="#374151" strokeWidth="1.5"/>
    <circle cx="12" cy="20" r="2" fill="#374151" stroke="none"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="#dc2626" strokeWidth="3"/>
  </IconWrapper>
);

export const DairyFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M8 4h8c1 0 2 1 2 2v12c0 1-1 2-2 2H8c-1 0-2-1-2-2V6c0-1 1-2 2-2z" fill="#374151" stroke="none"/>
    <circle cx="12" cy="2" r="1.5" fill="#374151" stroke="none"/>
    <rect x="10" y="8" width="4" height="6" rx="1" fill="#ffffff" stroke="none"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="#dc2626" strokeWidth="3"/>
  </IconWrapper>
);

// Placeholder for other icons that might be needed
export const SugarFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <rect x="8" y="8" width="8" height="8" rx="1" fill="#374151" stroke="none"/>
    <line x1="5" y1="5" x2="19" y2="19" stroke="#dc2626" strokeWidth="3"/>
  </IconWrapper>
);

export const WithSteviaIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M8 16c0-2 1-4 4-4s4 2 4 4" stroke="#374151" strokeWidth="2"/>
    <path d="M12 12V6" stroke="#374151" strokeWidth="2"/>
    <circle cx="12" cy="4" r="1" fill="#374151" stroke="none"/>
    <text x="12" y="20" textAnchor="middle" fontSize="6" fill="#374151">S</text>
  </IconWrapper>
);

export const FrozenIngredientsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#374151" stroke="none"/>
    <circle cx="6" cy="18" r="1" fill="#374151" stroke="none"/>
    <circle cx="18" cy="18" r="1" fill="#374151" stroke="none"/>
    <circle cx="12" cy="20" r="1" fill="#374151" stroke="none"/>
  </IconWrapper>
);

export const LupinIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <circle cx="12" cy="8" r="2" fill="#374151" stroke="none"/>
    <circle cx="16" cy="12" r="1.5" fill="#374151" stroke="none"/>
    <circle cx="12" cy="16" r="2" fill="#374151" stroke="none"/>
    <circle cx="8" cy="12" r="1.5" fill="#374151" stroke="none"/>
    <text x="12" y="13" textAnchor="middle" fontSize="6" fill="#ffffff">L</text>
  </IconWrapper>
);

export const MolluscsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 16c4 0 7-2 7-4s-3-4-7-4-7 2-7 4 3 4 7 4z" fill="#374151" stroke="none"/>
    <path d="M12 16v4" stroke="#374151" strokeWidth="2"/>
    <path d="M8 18h8" stroke="#374151" strokeWidth="1"/>
  </IconWrapper>
);

export const PeanutsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <ellipse cx="10" cy="10" rx="2.5" ry="4" fill="#374151" stroke="none"/>
    <ellipse cx="14" cy="14" rx="2.5" ry="4" fill="#374151" stroke="none"/>
    <path d="M11 12c1-1 2-1 3 0" stroke="#ffffff" strokeWidth="1"/>
  </IconWrapper>
);

export const SesameIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <circle cx="12" cy="12" r="1" fill="#374151" stroke="none"/>
    <circle cx="15" cy="9" r="0.8" fill="#374151" stroke="none"/>
    <circle cx="9" cy="9" r="0.8" fill="#374151" stroke="none"/>
    <circle cx="15" cy="15" r="0.8" fill="#374151" stroke="none"/>
    <circle cx="9" cy="15" r="0.8" fill="#374151" stroke="none"/>
    <circle cx="12" cy="7" r="0.5" fill="#374151" stroke="none"/>
    <circle cx="12" cy="17" r="0.5" fill="#374151" stroke="none"/>
  </IconWrapper>
);

export const SulphurDioxideIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20l-6-6h12z" fill="#374151" stroke="none"/>
    <path d="M12 4v10" stroke="#374151" strokeWidth="2"/>
    <text x="12" y="11" textAnchor="middle" fontSize="5" fill="#ffffff" fontWeight="bold">SO₂</text>
  </IconWrapper>
);

export const BarleyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <path d="M12 20V4" stroke="#374151" strokeWidth="2"/>
    <path d="M16 8l-4-4-4 4" stroke="#374151" strokeWidth="1.5"/>
    <path d="M16 12l-4-4-4 4" stroke="#374151" strokeWidth="1.5"/>
    <path d="M16 16l-4-4-4 4" stroke="#374151" strokeWidth="1.5"/>
    <circle cx="12" cy="20" r="1" fill="#374151" stroke="none"/>
    <text x="12" y="22" textAnchor="middle" fontSize="4" fill="#374151">B</text>
  </IconWrapper>
);

export const CitricAcidIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <IconWrapper bgColor="#f9fafb" iconColor="#374151" size="w-6 h-6" {...props}>
    <circle cx="12" cy="12" r="8" fill="#374151" stroke="none"/>
    <circle cx="12" cy="12" r="4" fill="#ffffff" stroke="none"/>
    <circle cx="12" cy="10" r="1" fill="#374151" stroke="none"/>
    <text x="12" y="17" textAnchor="middle" fontSize="5" fill="#374151">CA</text>
  </IconWrapper>
);
