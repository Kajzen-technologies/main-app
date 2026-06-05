import { Marker } from "../markers/marker.types";

export interface CachedMarkersData {
  markers: Marker[];
  lastSyncTimestamp: string;
}
