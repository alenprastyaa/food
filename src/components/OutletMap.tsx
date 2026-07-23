"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

type MapOutlet = { id: string; name: string; address: string; latitude: number; longitude: number };

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:28px;line-height:1;transform:translate(-50%,-100%)">📍</div>`,
  iconSize: [0, 0],
});

export default function OutletMap({ outlets }: { outlets: MapOutlet[] }) {
  if (outlets.length === 0) return null;
  const center: [number, number] = [outlets[0].latitude, outlets[0].longitude];

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-sumi/10 h-80">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {outlets.map((o) => (
          <Marker key={o.id} position={[o.latitude, o.longitude]} icon={pinIcon}>
            <Popup>
              <p className="font-bold">{o.name}</p>
              <p className="text-xs">{o.address}</p>
              <Link href={`/o/${o.id}`} className="text-xs font-bold text-red-600">
                Mulai Chat →
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
