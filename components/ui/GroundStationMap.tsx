"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default Leaflet icon in React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function GroundStationMap() {
  const [mounted, setMounted] = useState(false)

  // Bengaluru ISTRAC Coordinates
  const position: [number, number] = [13.0334, 77.5117]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <MapContainer 
      center={position} 
      zoom={12} 
      scrollWheelZoom={false} 
      className="w-full h-full z-0"
    >
      {/* ESRI World Imagery for Satellite View */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <Marker position={position} icon={customIcon}>
        <Popup className="text-sm font-semibold">
          <div className="text-black">
            ISRO Ground Station Uplink<br />
            Bengaluru (ISTRAC)
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
