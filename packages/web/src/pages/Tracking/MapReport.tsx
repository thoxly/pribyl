// components/Reports/MapReport.tsx
import { Box, Heading, Spinner, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import LiveYandexMap from './LiveYandexMap';
import LiveYandexMapLive from './LiveYandexMapLive';

interface MapReportProps {
  mode: "live" | "period" | "task";
  workerId: string;
  positions: any[];
  loading: boolean;
}

export default function MapReport({
  mode,
  workerId,
  positions,
  loading,
}: MapReportProps) {
  useEffect(() => {
    console.debug("[MapReport] Mode:", mode);
    console.debug("[MapReport] WorkerId:", workerId);
    console.debug("[MapReport] Positions length:", positions.length);
    console.debug("[MapReport] Loading:", loading);
  }, [mode, workerId, positions, loading]);

  return (
    <Box mt={6}>
      <Heading size="md" mb={4}>
        Перемещения сотрудников
      </Heading>

      {mode === "live" && (
        <>
          {console.debug("[MapReport] Rendering LiveYandexMapLive")}
          <LiveYandexMapLive workerId={workerId || undefined} />
        </>
      )}

      {["period", "task"].includes(mode) && !loading && (
        <>
          {console.debug("[MapReport] Rendering LiveYandexMap with positions")}
          <LiveYandexMap positions={positions} />
        </>
      )}

      {loading && (
        <>
          {console.debug("[MapReport] Loading spinner")}
          <Spinner />
        </>
      )}

      {!loading && ["period", "task"].includes(mode) && positions.length === 0 && (
        <>
          {console.debug("[MapReport] No data message")}
          <Text color="gray.500">Нет данных для отображения</Text>
        </>
      )}
    </Box>
  );
}
