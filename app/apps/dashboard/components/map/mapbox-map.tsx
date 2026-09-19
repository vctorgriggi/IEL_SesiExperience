'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useMemo } from 'react';
import type { LocationEventItem } from '@/features/events/data/get-event-locations';
import Map, { Marker } from 'react-map-gl/mapbox';

type ItemWithCoords = LocationEventItem & { lat: number; lng: number };

type MapboxMapProps = {
  center: [number, number];
  zoom: number;
  items: ItemWithCoords[];
  mapStyle: string;
  selectedId: string | null;
  onSelect: (item: ItemWithCoords | null) => void;
  /** Altura do container do mapa em px (ex.: 100% ou calc). */
  height: number | string;
};

export function MapboxMap({
  center,
  zoom,
  items,
  mapStyle,
  selectedId,
  onSelect,
  height
}: MapboxMapProps) {
  const token =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      : undefined;

  const lat = center[0];
  const lng = center[1];
  const initialViewState = useMemo(
    () => ({
      longitude: lng,
      latitude: lat,
      zoom
    }),
    [lat, lng, zoom]
  );

  if (!token) {
    return (
      <div
        className="flex w-full items-center justify-center bg-muted/30 text-muted-foreground"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <p className="text-center text-sm">
          Configure{' '}
          <code className="rounded bg-muted px-1">
            NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </code>{' '}
          no .env para exibir o mapa.
        </p>
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={initialViewState}
      style={{ width: '100%', height: height }}
      mapStyle={mapStyle}
      reuseMaps
      onClick={() => onSelect(null)}
    >
      {items.map((ev) => {
        const isSelected = selectedId === ev.id;
        return (
          <Marker
            key={ev.id}
            longitude={ev.lng}
            latitude={ev.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(isSelected ? null : ev);
            }}
          >
            <div
              className={`h-9 w-9 cursor-pointer rounded-full border-2 shadow-md transition-transform hover:scale-110 ${
                isSelected
                  ? 'border-primary bg-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
                  : 'border-white bg-[#f97316] hover:border-primary/50'
              }`}
              aria-label={ev.name}
            />
          </Marker>
        );
      })}
    </Map>
  );
}
