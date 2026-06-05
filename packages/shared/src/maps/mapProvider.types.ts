export type MapProviderType = "google" | "leaflet" | "apple";

export interface MapCoords {
  latitude: number;
  longitude: number;
}

export interface MapProviderConfig {
  provider: MapProviderType;
  apiKey?: string;
}
