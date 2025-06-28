import { useEffect, useRef, useState } from "react";
import { Box, Heading } from "@chakra-ui/react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";

interface LivePosition {
  userId: string;
  fullName: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const YANDEX_API_KEY =
  (import.meta as any).env?.VITE_YANDEX_MAPS_API_KEY ??
  (typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string | undefined)
    : undefined) ??
  "";

export default function LiveYandexMapLive({ workerId }: { workerId?: string }) {
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<ymaps.Map | null>(null);
  const hasCentered = useRef(false);

  useEffect(() => {
    const fetchPositions = async () => {
      const url = workerId
        ? `/api/live?workerId=${encodeURIComponent(workerId)}`
        : "/api/live";

      console.debug("[LiveYandexMapLive] Fetching positions from:", url);

      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.debug("[LiveYandexMapLive] Response status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const ct = res.headers.get("Content-Type") ?? "";
        console.debug("[LiveYandexMapLive] Content-Type:", ct);

        if (!ct.includes("application/json")) {
          const text = await res.text();
          console.error(
            "[LiveYandexMapLive] Unexpected response:",
            text.slice(0, 120)
          );
          throw new Error(`Unexpected response: ${ct}\n${text.slice(0, 120)}…`);
        }

        const data: LivePosition[] = await res.json();
        console.debug("[LiveYandexMapLive] Parsed positions:", data);

        setPositions(data);
      } catch (e) {
        console.error("[LiveYandexMapLive] Error fetching positions:", e);
      }
    };

    console.debug("[LiveYandexMapLive] useEffect mounted. workerId:", workerId);
    fetchPositions();
    intervalRef.current = setInterval(fetchPositions, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.debug("[LiveYandexMapLive] Cleared interval");
      }
    };
  }, [workerId]);

  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return;

    if (hasCentered.current) return; 

    if (positions.length === 1) {
      const { latitude, longitude } = positions[0];
      mapRef.current.setCenter([latitude, longitude], 14, {
        checkZoomRange: true,
      });
    } else {
      const bounds = positions.map((p) => [p.latitude, p.longitude]);
      mapRef.current.setBounds(bounds, { checkZoomRange: true });
    }

    hasCentered.current = true;
  }, [positions]);

  return (
    <>
      <Heading size="sm" mb={2}>
        Карта в реальном времени {workerId ? "(сотрудник)" : "(все)"}
      </Heading>
      <Box
        bg="white"
        borderRadius="xl"
        boxShadow="sm"
        h="60vh"
        overflow="hidden"
      >
        <YMaps query={{ lang: "ru_RU", apikey: YANDEX_API_KEY }}>
          <Map
            defaultState={{ center: [55.751244, 37.618423], zoom: 10 }}
            width="100%"
            height="100%"
            onLoad={() =>
              console.debug("[LiveYandexMapLive] Yandex map loaded")
            }
            instanceRef={(ref) => {
              mapRef.current = ref ?? null;
              console.debug("[LiveYandexMapLive] Map ref set:", !!ref);
            }}
          >
            {positions.map((pos) => (
              <Placemark
                key={pos.userId + pos.timestamp}
                geometry={[pos.latitude, pos.longitude]}
                properties={{
                  balloonContentHeader: pos.fullName,
                  balloonContentBody: new Date(
                    pos.timestamp
                  ).toLocaleTimeString(),
                }}
                options={{ preset: "islands#redPersonIcon" }} // ← только эта строка
              />
            ))}
          </Map>
        </YMaps>
      </Box>
    </>
  );
}
