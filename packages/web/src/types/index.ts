export interface WorkerLiveInfo {
  _id: string;
  fullName: string;
  photoUrl?: string;
  liveLocationActive: boolean;
}


export interface Position {
  userId: string;
  timestamp: string;

  // вариант 1 — старый ответ /tracker/period
  latitude?: number;
  longitude?: number;

  // вариант 2 — новый GeoJSON
  loc?: { type: 'Point'; coordinates: [number, number] };
}



export type MapBounds = [[number, number], [number, number]];