import { Box, Heading } from "@chakra-ui/react";
import { YMaps, Map as YMap, Placemark, Polyline } from "@pbe/react-yandex-maps";
import { useMemo, useState } from "react";

interface Position {
  userId: string;
  fullName: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface Props {
  positions: Position[];
}

const YANDEX_API_KEY =
  (import.meta as any).env?.VITE_YANDEX_MAPS_API_KEY ??
  (typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined)
    : undefined) ??
  "";

export default function LiveYandexMap({ positions }: Props) {
  const [mapReady, setMapReady] = useState(false);

  const groupedByUser: Map<string, Position[]> = useMemo(() => {
    const map = new Map<string, Position[]>();
    positions.forEach((pos: Position) => {
      if (!map.has(pos.userId)) map.set(pos.userId, []);
      map.get(pos.userId)!.push(pos);
    });
    return map;
  }, [positions]);

  const allCoordinates: [number, number][] = positions.map((p: Position) => [p.latitude, p.longitude]);

  const center: [number, number] =
    allCoordinates.length > 0
      ? allCoordinates[Math.floor(allCoordinates.length / 2)]
      : [55.751244, 37.618423];

  return (
    <>
      <Heading size="sm" mb={2}>
        Историческая карта маршрута
      </Heading>
      <Box bg="white" borderRadius="xl" boxShadow="sm" h="60vh" overflow="hidden">
        <YMaps query={{ lang: "ru_RU", apikey: YANDEX_API_KEY }}>
          <YMap
            defaultState={{ center, zoom: 12 }}
            width="100%"
            height="100%"
            onLoad={() => {
              console.debug("[LiveYandexMap] Карта загружена");
              setMapReady(true);
            }}
          >
            {mapReady &&
              [...groupedByUser.entries()].map(([userId, userPositions]) => {
                const coords: [number, number][] = userPositions.map((pos) => [pos.latitude, pos.longitude]);

                return (
                  <Polyline
                    key={`line-${userId}`}
                    geometry={coords}
                    options={{
                      strokeColor: '#007bff',
                      strokeWidth: 4,
                      strokeOpacity: 0.6,
                    }}
                  />
                );
              })}

            {mapReady &&
              positions.map((pos: Position, i: number) => (
                <Placemark
                  key={`${pos.userId}-${pos.timestamp}-${i}`}
                  geometry={[pos.latitude, pos.longitude]}
                  properties={{
                    balloonContentHeader: pos.fullName,
                    balloonContentBody: new Date(pos.timestamp).toLocaleString(),
                  }}
                  options={{
                    iconLayout: "default#image",
                    iconImageHref: pos.photoUrl || "/avatar-placeholder.png",
                    iconImageSize: [38, 38],
                    iconImageOffset: [-19, -19],
                  }}
                />
              ))}
          </YMap>
        </YMaps>
      </Box>
    </>
  );
}

// import { Box, Heading } from "@chakra-ui/react";
// import {
//   YMaps,
//   Map as YMap,
//   Placemark,
//   useYMaps,
// } from "@pbe/react-yandex-maps";
// import { useEffect, useMemo, useRef } from "react";

// interface Position {
//   userId: string;
//   fullName: string;
//   photoUrl?: string;
//   latitude: number;
//   longitude: number;
//   timestamp: string;
// }

// const YANDEX_API_KEY =
//   (import.meta as any).env?.VITE_YANDEX_MAPS_API_KEY ??
//   (process as any).env?.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ??
//   "";

// interface Props {
//   positions: Position[];
// }

// /* ─────────────────────────────────────────────────────────
//    Внешняя «скорлупа»: провайдер + заголовок/контейнеры
//    ───────────────────────────────────────────────────────── */
// export default function LiveYandexMap(props: Props) {
//   return (
//     <>
//       <Heading size="sm" mb={2}>
//         Историческая карта маршрута
//       </Heading>

//       <Box
//         bg="white"
//         borderRadius="xl"
//         boxShadow="sm"
//         h="60vh"
//         overflow="hidden"
//       >
//         <YMaps
//           query={{
//             lang: "ru_RU",
//             apikey: YANDEX_API_KEY,
//             load: "package.full", // или: "multiRouter"
//           }}
//         >
//           <LiveMapInner {...props} />
//         </YMaps>
//       </Box>
//     </>
//   );
// }

// // /* ─────────────────────────────────────────────────────────
// //    Внутренняя часть: здесь уже доступен контекст YMaps
// //    ───────────────────────────────────────────────────────── */
// // function LiveMapInner({ positions }: Props) {
// //   const ymaps = useYMaps(); // теперь контекст есть
// //   const mapRef = useRef<ymaps.Map | null>(null);

// //   /* --- группируем точки по пользователям --- */
// //   const grouped = useMemo(() => {
// //     const m = new Map<string, Position[]>();
// //     positions.forEach((p) => {
// //       (m.get(p.userId) ?? m.set(p.userId, []).get(p.userId)!).push(p);
// //     });
// //     return m;
// //   }, [positions]);

// //   /* --- вычисляем условный центр --- */
// //   const all = positions.map<[number, number]>(({ latitude, longitude }) => [
// //     latitude,
// //     longitude,
// //   ]);
// //   const center: [number, number] = all.length
// //     ? all[Math.floor(all.length / 2)]
// //     : [55.751244, 37.618423];

// //   /* --- рисуем маршруты, когда ymaps подгружается --- */
// //   useEffect(() => {
// //     if (!ymaps || !mapRef.current) return;

// //     const { geoObjects } = mapRef.current;
// //     geoObjects.removeAll();

// //     grouped.forEach((pts) => {
// //       if (pts.length < 2) return;
// //       const refPoints = pts.map((p) => [p.latitude, p.longitude]);

// //       const route = new ymaps.multiRouter.MultiRoute(
//         { referencePoints: refPoints, params: { routingMode: "auto" } },
//         {
//           boundsAutoApply: false,
//           routeStrokeColor: "#007bff",
//           routeStrokeWidth: 4,
//           routeStrokeOpacity: 0.6,
//           wayPointVisible: false,
//           pinVisible: false,
//         }
//       );

//       geoObjects.add(route);
//     });
//   }, [ymaps, grouped]);

//   return (
//     <YMap
//       defaultState={{ center, zoom: 13 }}
//       width="100%"
//       height="100%"
//       instanceRef={(m) => (mapRef.current = m)}
//     >
//       {positions.map((pos, i) => (
//         <Placemark
//           key={`${pos.userId}-${pos.timestamp}-${i}`}
//           geometry={[pos.latitude, pos.longitude]}
//           properties={{
//             balloonContentHeader: pos.fullName,
//             balloonContentBody: new Date(pos.timestamp).toLocaleString(),
//           }}
//           options={{
//             iconLayout: "default#image",
//             iconImageHref: pos.photoUrl || "/avatar-placeholder.png",
//             iconImageSize: [38, 38],
//             iconImageOffset: [-19, -19],
//           }}
//         />
//       ))}
//     </YMap>
//   );
// }
