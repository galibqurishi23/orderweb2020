'use client';

import React from 'react';
import { characteristics } from '@/data/characteristicsData';
import { getIconComponent } from '@/lib/custom-icons-service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function CharacteristicsReference() {
  // Only show the specific characteristics requested
  const selectedCharacteristics = characteristics.filter(char => 
    ['fish', 'wheat', 'crustaceans', 'dairy', 'vegetarian', 'vegan', 'spicy-1', 'nuts', 'eggs', 'gluten-free', 'celery', 'mustard', 'soya', 'cinnamon', 'halal', 'dairy-free'].includes(char.id)
  );

  return (
    <div className="bg-gray-50 border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-3">
          <h3 className="text-sm font-medium text-gray-700">Dietary Information & Allergens</h3>
        </div>
        
        <TooltipProvider>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {selectedCharacteristics.map((characteristic) => {
              // Get the appropriate icon (custom or default)
              const IconComponent = getIconComponent(characteristic.id, characteristic.icon);
              return (
                <Tooltip key={characteristic.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-help">
                      <IconComponent />
                      <span className="text-xs text-gray-600">{characteristic.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{characteristic.label}</p>
                    <p className="text-xs text-gray-500">
                      {characteristic.id.includes('free') && 'Free from this ingredient'}
                      {characteristic.id === 'vegetarian' && 'No meat or fish'}
                      {characteristic.id === 'vegan' && 'No animal products'}
                      {characteristic.id === 'halal' && 'Prepared according to Islamic law'}
                      {characteristic.id.includes('spicy') && 'Spicy dish'}
                      {['eggs', 'fish', 'dairy', 'nuts', 'wheat', 'crustaceans', 'celery', 'mustard', 'soya', 'cinnamon'].includes(characteristic.id) && 'Contains this allergen'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
