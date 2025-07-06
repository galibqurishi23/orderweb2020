import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils';

const IconWrapper = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <span className={cn('inline-block w-5 h-5', className)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {children}
        </svg>
    </span>
);

const CircleFrame = ({ children, ...props }: SVGProps<SVGSVGElement> & { children: React.ReactNode }) => (
    <IconWrapper {...props}>
        <circle cx="12" cy="12" r="10" />
        {children}
    </IconWrapper>
);

// Simplified graphical icons
export const VegetarianIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M16 8a4 4 0 00-8 0c0 6 4 12 4 12s4-6 4-12z"/></CircleFrame>;
export const VeganIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M7 15l5-10 5 10"/><path d="M9 12h6"/></CircleFrame>;
export const HalalIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><text x="12" y="16" textAnchor="middle" fontSize="10" strokeWidth="1" fontWeight="bold" >H</text></CircleFrame>;
export const NutFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M15.5 12a3.5 3.5 0 01-7 0c0-4 3.5-7 3.5-7s3.5 3 3.5 7z"/><line x1="5" y1="19" x2="19" y2="5"/></CircleFrame>;
export const GlutenFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 20V4m-4 4 4-4 4 4m-8 4l4-4 4 4m-8 4l4-4 4 4"/><line x1="5" y1="19" x2="19" y2="5"/></CircleFrame>;
export const DairyFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M7 6h10l-1.5 9H8.5L7 6z"/><path d="M12 4v2"/><line x1="5" y1="19" x2="19" y2="5"/></CircleFrame>;
export const SugarFreeIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><rect x="8" y="8" width="8" height="8" rx="1"/><line x1="5" y1="19" x2="19" y2="5"/></CircleFrame>;
export const WithSteviaIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 2L8 12h8z"/></CircleFrame>;
export const SpicyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M10 12a6 6 0 002 8 6 6 0 006-6c0-4-3-6-6-6s-6 2-6 6a6 6 0 002 4z"/></CircleFrame>;
export const FrozenIngredientsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 2v20M2 12h20M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></CircleFrame>;
export const CeleryIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M15 10a4 4 0 01-8 0V9a4 4 0 018 0v1z"/><path d="M11 10v10"/></CircleFrame>;
export const WheatIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 20V4"/><path d="M8 8l4-4 4 4"/><path d="M8 12l4-4 4 4"/><path d="M8 16l4-4 4 4"/></CircleFrame>;
export const CrustaceansIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 12a4 4 0 00-4 4h8a4 4 0 00-4-4z"/><path d="M12 8V4m0 16v-4m-4-8a4 4 0 018 0"/></CircleFrame>;
export const EggsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><ellipse cx="12" cy="12" rx="4" ry="6"/></CircleFrame>;
export const FishIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="1"/></CircleFrame>;
export const LupinIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><circle cx="12" cy="9" r="2"/><circle cx="15.5" cy="12" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="8.5" cy="12" r="2"/></CircleFrame>;
export const DairyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M7 6h10l-1.5 9H8.5L7 6z"/><path d="M12 4v2"/></CircleFrame>;
export const MolluscsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 14a8 8 0 100-12 8 8 0 000 12z"/><path d="M12 14v8"/></CircleFrame>;
export const MustardIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><rect x="9" y="9" width="6" height="8" rx="1"/><rect x="8" y="6" width="8" height="3" rx="1"/></CircleFrame>;
export const NutsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 12a4 4 0 01-4-4 4 4 0 018 0 4 4 0 01-4 4z"/></CircleFrame>;
export const PeanutsIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 6a4 4 0 000 8 4 4 0 000-8zm0 5a1 1 0 110-2 1 1 0 010 2z"/><path d="M12 14s-4 2-4 4h8s-4-2-4-4z"/></CircleFrame>;
export const SesameIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><circle cx="12" cy="12" r="1"/><circle cx="15" cy="10" r="1"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="14" r="1"/><circle cx="9" cy="14" r="1"/></CircleFrame>;
export const SoyaIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><circle cx="10" cy="11" r="2"/><circle cx="14" cy="11" r="2"/><circle cx="12" cy="15" r="2"/></CircleFrame>;
export const SulphurDioxideIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 20l-6-6h12z"/><path d="M12 4v10"/></CircleFrame>;
export const BarleyIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M12 20V4"/><path d="M16 8l-4-4-4 4"/><path d="M16 12l-4-4-4 4"/><path d="M16 16l-4-4-4 4"/></CircleFrame>;
export const CinnamonIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><rect x="8" y="4" width="2" height="16" rx="1"/><rect x="14" y="4" width="2" height="16" rx="1" transform="rotate(30 15 12)"/></CircleFrame>;
export const CitricAcidIcon: ComponentType<SVGProps<SVGSVGElement>> = (props) => <CircleFrame {...props}><path d="M9 20v-8a3 3 0 016 0v8"/><path d="M6 20h12"/></CircleFrame>;
