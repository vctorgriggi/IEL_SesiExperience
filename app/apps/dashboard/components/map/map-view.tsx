'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapDetailPanel } from '@/components/map/map-detail-panel';
import type { LocationEventItem } from '@/features/events/data/get-event-locations';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';

type ItemWithCoords = LocationEventItem & { lat: number; lng: number };

type MapboxMapProps = {
  center: [number, number];
  zoom: number;
  items: ItemWithCoords[];
  mapStyle: string;
  selectedId: string | null;
  onSelect: (item: ItemWithCoords | null) => void;
  height: number | string;
};

const MapboxMap = dynamic<MapboxMapProps>(
  () => import('@/components/map/mapbox-map').then((m) => m.MapboxMap),
  { ssr: false }
);

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
const DEFAULT_ZOOM = 10;

type MapViewProps = {
  items: ItemWithCoords[];
};

export function MapView({ items }: MapViewProps) {
  const currentOrgSlug = useCurrentOrganizationSlug();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(480);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? {};
      if (typeof height === 'number' && height > 0) setMapHeight(height);
    });
    ro.observe(el);
    setMapHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  const selectedItem = items.find((e) => e.id === selectedId) ?? null;
  const onSelect = useCallback((item: ItemWithCoords | null) => {
    setSelectedId(item?.id ?? null);
  }, []);

  if (!items.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
        Nenhum evento com localização definida.
      </div>
    );
  }

  const first = items[0];
  const center: [number, number] = [first.lat, first.lng];

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] w-full overflow-hidden rounded-xl border border-border">
      <div
        ref={mapContainerRef}
        className="flex h-full w-1/2 min-w-0 shrink-0 flex-col overflow-hidden border-r border-border"
      >
        <div className="relative h-full w-full">
          <MapboxMap
            center={center}
            zoom={DEFAULT_ZOOM}
            items={items}
            mapStyle={MAPBOX_STYLE}
            selectedId={selectedId}
            onSelect={onSelect}
            height={mapHeight}
          />
        </div>
      </div>
      <div className="flex h-full w-1/2 min-w-0 shrink-0 flex-col">
        <MapDetailPanel
          selectedItem={selectedItem}
          currentOrgSlug={currentOrgSlug ?? null}
        />
      </div>
    </div>
  );
}
