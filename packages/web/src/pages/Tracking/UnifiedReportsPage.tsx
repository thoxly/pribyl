import {
  Box,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  fetchWorkers,
  fetchTasksByWorker,
  fetchPositionsByPeriod,
} from "./reportApi";
import WorkerSelectMenu from "./WorkerSelectMenu";
import WorkerStatsReport from "./WorkerStatsReport";
import TasksSummaryReport from "./TasksSummaryReport";
import MapReport from "./MapReport";
import DatePicker from "../Tasks/DatePicker";
import ModeSelectMenu from "./ModeSelectMenu";
import { toServerTime } from "../../utils/timeUtils";

export type Mode = "live" | "period" | "task";

// Helper function to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function UnifiedReportsPage() {
  const [mode, setMode] = useState<Mode>("live");
  const [workerId, setWorkerId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  // Set default dates to today (start and end of day)
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  const [dateFrom, setDateFrom] = useState<string>(formatDate(startOfDay));
  const [dateTo, setDateTo] = useState<string>(formatDate(endOfDay));

  const [workers, setWorkers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // load workers once
  useEffect(() => {
    console.debug("[Reports] Fetching initial workers...");
    fetchWorkers().then((res) => {
      console.debug("[Reports] Workers loaded:", res);
      setWorkers(res);
    });
  }, []);

  // refetch tasks when worker changes
  useEffect(() => {
    if (workerId) {
      console.debug("[Reports] Worker selected:", workerId);
      fetchTasksByWorker(workerId).then((res) => {
        console.debug("[Reports] Tasks for worker loaded:", res);
        setTasks(res);
      });
    } else {
      console.debug("[Reports] No worker selected, clearing tasks");
      setTasks([]);
    }
  }, [workerId]);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === "period" && dateFrom && dateTo) {
        console.debug("[Reports] Fetching positions for period:", {
          workerId,
          dateFrom,
          dateTo,
        });

        // Создаём локальные даты
        const fromDate = new Date(`${dateFrom}T00:00:00`);
        const toDate = new Date(`${dateTo}T23:59:59`);

        const serverDateFrom = toServerTime(fromDate);
        const serverDateTo = toServerTime(toDate);

        setLoading(true);
        await fetchPositionsByPeriod(
          workerId || undefined,
          serverDateFrom,
          serverDateTo
        )
          .then((res) => {
            console.debug("[Reports] Positions (period) loaded:", res);
            setPositions(res);
          })
          .finally(() => setLoading(false));
      }
    };

    fetchData();
  }, [mode, workerId, dateFrom, dateTo, taskId]);

  useEffect(() => {
    if (mode !== "live") return; // В других режимах ничего не делаем

    const load = async () => {
      console.debug("[Reports] Polling workers (live)");
      const ws = await fetchWorkers();
      setWorkers(ws);
    };

    load(); // первая загрузка сразу
    const timer = setInterval(load, 10_000);

    // очистка таймера при смене режима или размонтировании
    return () => clearInterval(timer);
  }, [mode]); // <-- теперь зависит от mode

  const resetFilters = () => {
    console.debug("[Reports] Resetting filters");
    setPositions([]);
    setTaskId("");

    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    setDateFrom(formatDate(start));
    setDateTo(formatDate(end));
  };

  const handleModeChange = (newMode: Mode) => {
    console.debug("[Reports] Report mode changed:", newMode);
    setMode(newMode);

    // Сброс фильтров
    resetFilters();

    if (newMode === "period") setLoading(true);
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        Отчёты
      </Heading>

      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={4}
        bg="gray.50"
        w="100%"
        mb={6}
      >
        <Heading size="sm" mb={3}>
          Фильтры
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          <FormControl>
            <FormLabel>Вид отчёта</FormLabel>
            <ModeSelectMenu value={mode} onChange={handleModeChange} />
          </FormControl>

          <FormControl>
            <FormLabel>Сотрудник</FormLabel>
            <WorkerSelectMenu
              workers={workers}
              value={workerId}
              onChange={(id) => {
                console.debug("[Reports] Worker filter changed:", id);
                setWorkerId(id);
                setTaskId("");
                setPositions([]);
              }}
            />
          </FormControl>

          {mode === "task" && (
            <FormControl>
              <FormLabel>Задача</FormLabel>
              <Select
                placeholder="Выберите задачу"
                value={taskId}
                onChange={(e) => {
                  console.debug(
                    "[Reports] Task filter changed:",
                    e.target.value
                  );
                  setTaskId(e.target.value);
                }}
                isDisabled={!workerId}
              >
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}

          {mode === "period" && (
            <>
              <FormControl>
                <FormLabel>С даты</FormLabel>
                <DatePicker
                  value={dateFrom}
                  onChange={(val) => {
                    console.debug("[Reports] Date from changed:", val);
                    setDateFrom(val);
                  }}
                  placeholder="Начало периода"
                />
              </FormControl>

              <FormControl>
                <FormLabel>По дату</FormLabel>
                <DatePicker
                  value={dateTo}
                  onChange={(val) => {
                    console.debug("[Reports] Date to changed:", val);
                    setDateTo(val);
                  }}
                  placeholder="Конец периода"
                />
              </FormControl>
            </>
          )}
        </SimpleGrid>
      </Box>

      <Box mt={8}>
        <MapReport
          mode={mode}
          workerId={workerId}
          positions={positions}
          loading={loading}
        />
        <WorkerStatsReport noHeading />
        <TasksSummaryReport noHeading />
      </Box>
    </Box>
  );
}
