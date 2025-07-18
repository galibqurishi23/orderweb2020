'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as turf from '@turf/turf';
import type { DeliveryZone } from '@/lib/types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  zones: DeliveryZone[];
  restaurantLocation?: [number, number]; // [lat, lng]
  onZoneCreate?: (zone: Partial<DeliveryZone>) => void;
  editMode?: boolean;
  height?: string;
  selectedZone?: DeliveryZone | null;
}

// Colors for different zones
const zoneColors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
];

function DrawControl({ onZoneCreate }: { onZoneCreate?: (zone: Partial<DeliveryZone>) => void }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (!onZoneCreate) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2,
          },
        },
        circle: {
          metric: true,
          shapeOptions: {
            color: '#10B981',
            weight: 2,
            fillOpacity: 0.2,
          },
        },
        rectangle: {
          shapeOptions: {
            color: '#8B5CF6',
            weight: 2,
            fillOpacity: 0.2,
          },
        },
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Handle creation
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const { layer, layerType } = event;
      drawnItems.addLayer(layer);

      let geographicData: DeliveryZone['geographicData'];
      let center: [number, number];

        if (layerType === 'polygon' || layerType === 'rectangle') {
        const coords: [number, number][] = layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lng, latlng.lat]);
        const bounds = layer.getBounds();
        const boundCenter = bounds.getCenter();
        center = [boundCenter.lat, boundCenter.lng];
        
        geographicData = {
          type: 'polygon',
          coordinates: [coords], // Wrap in array for GeoJSON format
          center: [boundCenter.lng, boundCenter.lat], // [lng, lat] format
        };
      } else if (layerType === 'circle') {
        const centerLatLng = layer.getLatLng();
        const radius = layer.getRadius();
        center = [centerLatLng.lat, centerLatLng.lng];
        
        geographicData = {
          type: 'circle',
          coordinates: [[[centerLatLng.lng, centerLatLng.lat]]], // Proper GeoJSON format
          center: [centerLatLng.lng, centerLatLng.lat], // [lng, lat] format
          radius: radius,
        };
      }

      if (geographicData) {
        // Add interactive popup for zone configuration
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
          <div class="p-3 min-w-64">
            <h3 class="font-semibold mb-3 text-gray-800">Configure Delivery Zone</h3>
            <form id="zone-form-${layer._leaflet_id}">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Zone Name</label>
                  <input type="text" name="name" placeholder="e.g., Central London" 
                         class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Delivery Time (min)</label>
                    <input type="number" name="deliveryTime" value="45" min="1" 
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Delivery Fee (£)</label>
                    <input type="number" name="deliveryFee" value="2.50" step="0.01" min="0" 
                           class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Minimum Order (£)</label>
                  <input type="number" name="minOrder" value="10.00" step="0.01" min="0" 
                         class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                </div>
                <div class="flex gap-2 pt-2">
                  <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors">
                    Save Zone
                  </button>
                  <button type="button" onclick="this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click()" 
                          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        `;

        // Add form submission handler
        const form = popupContent.querySelector('form') as HTMLFormElement;
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          
          const newZone: Partial<DeliveryZone> = {
            id: `zone-${Date.now()}`,
            name: formData.get('name') as string,
            type: 'geographic',
            postcodes: [],
            deliveryFee: parseFloat(formData.get('deliveryFee') as string),
            minOrder: parseFloat(formData.get('minOrder') as string),
            deliveryTime: parseInt(formData.get('deliveryTime') as string),
            collectionTime: 20,
            geographicData,
          };

          onZoneCreate(newZone);
          map.closePopup();
        });

        layer.bindPopup(popupContent, {
          maxWidth: 300,
          closeOnClick: false,
          autoClose: false,
        }).openPopup();
      }
    });

    // Handle editing
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        console.log('Zone edited:', layer);
        // You could emit updates here if needed
      });
    });

    // Handle deletion
    map.on(L.Draw.Event.DELETED, (event: any) => {
      const layers = event.layers;
      console.log(`${layers.getLayers().length} zone(s) deleted`);
      // You could emit deletions here if needed
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onZoneCreate]);

  return null;
}

export function LeafletMap({
  zones,
  restaurantLocation = [51.5074, -0.1278], // Default to London
  onZoneCreate,
  editMode = false,
  height = '400px',
  selectedZone,
}: MapProps) {
  const [mapCenter] = useState<[number, number]>(restaurantLocation);

  const getZoneColor = (index: number) => {
    return zoneColors[index % zoneColors.length];
  };

  const renderZone = (zone: DeliveryZone, index: number) => {
    if (zone.type !== 'geographic' || !zone.geographicData) return null;

    const color = getZoneColor(index);
    const isSelected = selectedZone?.id === zone.id;
    const opacity = isSelected ? 0.8 : 0.5;

    if (zone.geographicData.type === 'polygon' && zone.geographicData.coordinates) {
      const positions: [number, number][] = zone.geographicData.coordinates[0].map(coord => [coord[1], coord[0]]);
      return (
        <Polygon
          key={zone.id}
          positions={positions}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            weight: isSelected ? 3 : 2,
          }}
        >
          <div className="leaflet-popup-content">
            <div className="p-2">
              <h3 className="font-semibold text-sm">{zone.name}</h3>
              <p className="text-xs text-gray-600">Delivery: {zone.deliveryTime}min</p>
              <p className="text-xs text-gray-600">Fee: £{zone.deliveryFee.toFixed(2)}</p>
              <p className="text-xs text-gray-600">Min Order: £{zone.minOrder.toFixed(2)}</p>
            </div>
          </div>
        </Polygon>
      );
    } else if (zone.geographicData.type === 'circle' && zone.geographicData.center && zone.geographicData.radius) {
      return (
        <Circle
          key={zone.id}
          center={[zone.geographicData.center[1], zone.geographicData.center[0]]} // [lat, lng] for display
          radius={zone.geographicData.radius}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            weight: isSelected ? 3 : 2,
          }}
        >
          <div className="leaflet-popup-content">
            <div className="p-2">
              <h3 className="font-semibold text-sm">{zone.name}</h3>
              <p className="text-xs text-gray-600">Delivery: {zone.deliveryTime}min</p>
              <p className="text-xs text-gray-600">Fee: £{zone.deliveryFee.toFixed(2)}</p>
              <p className="text-xs text-gray-600">Min Order: £{zone.minOrder.toFixed(2)}</p>
            </div>
          </div>
        </Circle>
      );
    }

    return null;
  };

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Restaurant marker */}
        <Marker position={restaurantLocation} />

        {/* Render existing zones */}
        {zones.map((zone, index) => renderZone(zone, index))}

        {/* Drawing controls for edit mode */}
        {editMode && onZoneCreate && <DrawControl onZoneCreate={onZoneCreate} />}
      </MapContainer>
    </div>
  );
}

// Utility function to check if a point is within a zone
export function isPointInZone(lat: number, lng: number, zone: DeliveryZone): boolean {
  if (zone.type === 'postcode') {
    // For postcode zones, we'd need to geocode the point to get its postcode
    // This would require additional API integration
    return false;
  }

  if (zone.type === 'geographic' && zone.geographicData) {
    const point = turf.point([lng, lat]);

    if (zone.geographicData.type === 'polygon' && zone.geographicData.coordinates) {
      const polygon = turf.polygon(zone.geographicData.coordinates as [number, number][][]);
      return turf.booleanPointInPolygon(point, polygon);
    } else if (zone.geographicData.type === 'circle' && zone.geographicData.center && zone.geographicData.radius) {
      const center = turf.point(zone.geographicData.center);
      const distance = turf.distance(point, center, { units: 'meters' });
      return distance <= zone.geographicData.radius;
    }
  }

  return false;
}

// Utility function to geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return null;
}
