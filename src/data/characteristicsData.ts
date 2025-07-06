import type { Characteristic } from '@/lib/types';
import type { ComponentType, SVGProps } from 'react';
import { 
    VegetarianIcon, VeganIcon, HalalIcon, NutFreeIcon, GlutenFreeIcon, DairyFreeIcon,
    SugarFreeIcon, WithSteviaIcon, SpicyIcon, FrozenIngredientsIcon, CeleryIcon,
    WheatIcon, CrustaceansIcon, EggsIcon, FishIcon, LupinIcon, DairyIcon, MolluscsIcon,
    MustardIcon, NutsIcon, PeanutsIcon, SesameIcon, SoyaIcon, SulphurDioxideIcon,
    BarleyIcon, CinnamonIcon, CitricAcidIcon
} from '@/components/icons/dietary';


export const characteristics: { id: Characteristic; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: VegetarianIcon },
  { id: 'vegan', label: 'Vegan', icon: VeganIcon },
  { id: 'halal', label: 'Halal', icon: HalalIcon },
  { id: 'nut-free', label: 'Nut Free', icon: NutFreeIcon },
  { id: 'gluten-free', label: 'Gluten Free', icon: GlutenFreeIcon },
  { id: 'dairy-free', label: 'Dairy Free', icon: DairyFreeIcon },
  { id: 'sugar-free', label: 'Sugar Free', icon: SugarFreeIcon },
  { id: 'with-stevia', label: 'With Stevia', icon: WithSteviaIcon },
  { id: 'spicy-1', label: 'Spicy', icon: SpicyIcon },
  { id: 'spicy-2', label: 'Spicy (Hot)', icon: SpicyIcon },
  { id: 'spicy-3', label: 'Spicy (Extra Hot)', icon: SpicyIcon },
  { id: 'frozen-ingredients', label: 'Frozen Ingredients', icon: FrozenIngredientsIcon },
  { id: 'celery', label: 'Celery', icon: CeleryIcon },
  { id: 'wheat', label: 'Wheat', icon: WheatIcon },
  { id: 'crustaceans', label: 'Crustaceans', icon: CrustaceansIcon },
  { id: 'eggs', label: 'Eggs', icon: EggsIcon },
  { id: 'fish', label: 'Fish', icon: FishIcon },
  { id: 'lupin', label: 'Lupin', icon: LupinIcon },
  { id: 'dairy', label: 'Dairy', icon: DairyIcon },
  { id: 'molluscs', label: 'Molluscs', icon: MolluscsIcon },
  { id: 'mustard', label: 'Mustard', icon: MustardIcon },
  { id: 'nuts', label: 'Nuts', icon: NutsIcon },
  { id: 'peanuts', label: 'Peanuts', icon: PeanutsIcon },
  { id: 'sesame', label: 'Sesame', icon: SesameIcon },
  { id: 'soya', label: 'Soya', icon: SoyaIcon },
  { id: 'sulphur-dioxide', label: 'Sulphur Dioxide', icon: SulphurDioxideIcon },
  { id: 'barley', label: 'Barley', icon: BarleyIcon },
  { id: 'cinnamon', label: 'Cinnamon', icon: CinnamonIcon },
  { id: 'citric-acid', label: 'Citric Acid', icon: CitricAcidIcon },
];
