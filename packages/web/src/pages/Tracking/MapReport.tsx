/* src/components/Reports/MapReport.tsx */
import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import LiveYandexMap from "./LiveYandexMap";
import LiveYandexMapLive from "./LiveYandexMapLive";
import { useTrackSegments } from "../../hooks/useTrackSegments";

/* -------- типы пропсов -------- */
interface MapReportProps {
  mode: "live" | "period" | "task";
  workerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function MapReport({ mode, workerId, dateFrom, dateTo }: MapReportProps) {
  const isHistory = mode === "period" || mode === "task";
  const { segments, loading } = useTrackSegments({
    workerId: workerId ?? "",
    dateFrom: dateFrom ?? "",
    dateTo: dateTo ?? "",
  });
  const canShowHistory = isHistory && !!workerId && !!dateFrom && !!dateTo && segments.length > 0;

  return (
    <Box mt={6}>
      <Heading size="md" mb={4}>
        Перемещения сотрудников
      </Heading>

      {mode === "live" && <LiveYandexMapLive workerId={workerId} />}

      {isHistory && loading && <Spinner />}

      {isHistory && !loading && segments.length === 0 && (
        <Text color="gray.500">Нет данных для отображения</Text>
      )}

      {canShowHistory && (
        <LiveYandexMap workerId={workerId!} dateFrom={dateFrom!} dateTo={dateTo!} />
      )}
    </Box>
  );
}
