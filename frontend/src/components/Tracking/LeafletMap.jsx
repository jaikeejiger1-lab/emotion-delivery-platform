/**
 * LeafletMap.jsx — SSR-Safe Real-Time OpenStreetMap Radar
 *
 * Renders live GPS courier telemetry and destination marker using react-leaflet.
 * Uses custom high-fidelity HTML L.divIcon emojis to guarantee zero visual glitches.
 */
'use client';
import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';

// Helper component to auto-pan and center map when live GPS coordinates change
function MapUpdater({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat !== undefined && center.lng !== undefined) {
      map.setView([center.lat, center.lng], map.getZoom() || zoom, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [center, map, zoom]);
  return null;
}

// Custom High-Fidelity Courier Marker (Pink Rocket Glow)
const createCourierIcon = () =>
  L.divIcon({
    className: 'custom-courier-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #EC4899, #F43F5E);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 16px rgba(236, 72, 153, 0.8), 0 4px 10px rgba(0, 0, 0, 0.5);
        font-size: 22px;
        transform: translate(-50%, -50%);
        animation: pulse 2s infinite;
      ">🚀</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });

// Custom High-Fidelity Destination Marker (Purple Gift Glow)
const createDestinationIcon = () =>
  L.divIcon({
    className: 'custom-destination-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #8B5CF6, #6D28D9);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 14px rgba(139, 92, 246, 0.7), 0 4px 8px rgba(0, 0, 0, 0.5);
        font-size: 20px;
        transform: translate(-50%, -50%);
      ">🎁</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

export default function LeafletMap({
  agentCoords,
  destCoords,
  agentName = 'Courier Agent',
  agentPhone = '',
  recipientName = 'Destination',
  recipientAddress = '',
}) {
  // Default fallback center (Mumbai, India or provided coordinates)
  const defaultCenter = agentCoords?.lat ? [agentCoords.lat, agentCoords.lng] :
                        destCoords?.lat ? [destCoords.lat, destCoords.lng] :
                        [19.076, 72.877];

  const courierIcon = React.useMemo(() => typeof window !== 'undefined' ? createCourierIcon() : null, []);
  const destIcon = React.useMemo(() => typeof window !== 'undefined' ? createDestinationIcon() : null, []);

  // Calculate polyline path if both points exist
  const polylinePositions = React.useMemo(() => {
    if (agentCoords?.lat && destCoords?.lat) {
      return [
        [agentCoords.lat, agentCoords.lng],
        [destCoords.lat, destCoords.lng],
      ];
    }
    return null;
  }, [agentCoords, destCoords]);

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#0A0A14]">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={agentCoords?.lat ? agentCoords : destCoords} />

        {/* Route Line */}
        {polylinePositions && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#EC4899',
              weight: 4,
              dashArray: '8, 12',
              opacity: 0.8,
            }}
          />
        )}

        {/* Destination Marker */}
        {destCoords?.lat && destIcon && (
          <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-gray-900 font-sans">
                <p className="font-bold text-sm text-purple-900">🎁 Delivery Destination</p>
                <p className="text-xs font-semibold mt-0.5">{recipientName}</p>
                {recipientAddress && <p className="text-[11px] text-gray-600 mt-1">{recipientAddress}</p>}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Courier Agent Marker */}
        {agentCoords?.lat && courierIcon && (
          <Marker position={[agentCoords.lat, agentCoords.lng]} icon={courierIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-gray-900 font-sans">
                <p className="font-bold text-sm text-pink-600 flex items-center gap-1">
                  <span>🚀 Live Courier Partner</span>
                </p>
                <p className="text-xs font-semibold mt-0.5">{agentName}</p>
                {agentPhone && <p className="text-[11px] font-mono text-gray-700 mt-0.5">📞 {agentPhone}</p>}
                <p className="text-[10px] text-green-700 font-bold mt-1.5 bg-green-100 px-1.5 py-0.5 rounded-full inline-block">
                  ● GPS Signal Active
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Live Radar Overlay Badge */}
      <div className="absolute top-4 left-4 z-[400] bg-[#14142B]/90 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
        <div>
          <p className="text-[11px] font-extrabold text-white uppercase tracking-wider">Live OpenStreetMap Radar</p>
          <p className="text-[10px] text-white/60">
            {agentCoords?.lat ? `Lat: ${Number(agentCoords.lat).toFixed(4)} | Lng: ${Number(agentCoords.lng).toFixed(4)}` : 'Waiting for GPS telemetry...'}
          </p>
        </div>
      </div>
    </div>
  );
}
