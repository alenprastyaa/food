"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

type MapOutlet = { id: string; name: string; address: string; latitude: number; longitude: number };

// Brand-red pin instead of an emoji, so markers match the rest of the UI.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="38" viewBox="0 0 24 30" fill="none" style="transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(16,24,40,.3))">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 18 12 18s12-9.75 12-18c0-6.627-5.373-12-12-12z" fill="#C52424"/>
    <circle cx="12" cy="12" r="4.5" fill="#fff"/>
  </svg>`,
  iconSize: [0, 0],
});

export default function OutletMap({ outlets }: { outlets: MapOutlet[] }) {
  if (outlets.length === 0) return null;
  const center: [number, number] = [outlets[0].latitude, outlets[0].longitude];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-4 h-80">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {outlets.map((o) => (
          <Marker key={o.id} position={[o.latitude, o.longitude]} icon={pinIcon}>
            <Popup>
              <p className="font-semibold">{o.name}</p>
              <p className="text-xs">{o.address}</p>
              <Link href={`/o/${o.id}`} className="text-xs font-semibold text-red-600">
                Mulai Chat →
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
