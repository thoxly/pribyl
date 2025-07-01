import { Box, Heading } from "@chakra-ui/react";
import { YMaps, Map as YMap, Polyline } from "@pbe/react-yandex-maps";
import { useState } from "react";
import { useTrackSegments } from "../../hooks/useTrackSegments";

interface Props {
  workerId: string;
  /** ISO-строки в локальном формате (YYYY-MM-DD) */
  dateFrom: string;
  dateTo: string;
}

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || "";

export default function LiveYandexMap({ workerId, dateFrom, dateTo }: Props) {
  const { segments } = useTrackSegments({ workerId, dateFrom, dateTo });
  const center: [number, number] =
    segments.length > 0
      ? segments[Math.floor(segments.length / 2)]
      : [55.751244, 37.618423];

  return (
    <>
      <Heading size="sm" mb={2}>
        Исторический маршрут
      </Heading>
      <Box bg="white" borderRadius="xl" boxShadow="sm" h="60vh" overflow="hidden">
        <YMaps query={{ lang: "ru_RU", apikey: YANDEX_API_KEY }}>
          <YMap defaultState={{ center, zoom: 12 }} width="100%" height="100%">
            {segments.length > 0 && (
              <Polyline
                geometry={segments}
                options={{ strokeColor: "#007bff", strokeWidth: 4, strokeOpacity: 0.7 }}
              />
            )}
          </YMap>
        </YMaps>
      </Box>
    </>
  );
}
