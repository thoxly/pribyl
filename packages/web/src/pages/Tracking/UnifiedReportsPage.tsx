/* src/pages/UnifiedReportsPage.tsx
   – обновлённая версия под новый MapReport (dateFrom / dateTo) и unified fetch */

import {
  Box,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchWorkers, fetchTasksByWorker } from "./reportApi";
import WorkerSelectMenu from "./WorkerSelectMenu";
import WorkerStatsReport from "./WorkerStatsReport";
import TasksSummaryReport from "./TasksSummaryReport";
import MapReport from "./MapReport";
import DatePicker from "../Tasks/DatePicker";
import ModeSelectMenu from "./ModeSelectMenu";

export type Mode = "live" | "period" | "task";

/* — helper YYYY-MM-DD — */
const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export default function UnifiedReportsPage() {
  /* ─────────── state ─────────── */
  const [mode, setMode]             = useState<Mode>("live");
  const [workerId, setWorkerId]     = useState<string>("");
  const [taskId, setTaskId]         = useState<string>("");

  /* дефолт – сегодняшний день (локально) */
  const today       = new Date();
  const [dateFrom, setDateFrom] = useState(formatDate(today));
  const [dateTo, setDateTo] = useState(formatDate(today));

  const [workers, setWorkers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  /* ─────────── initial workers ─────────── */
  useEffect(() => {
    fetchWorkers().then(setWorkers);
  }, []);

  /* ─────────── tasks for current worker ─────────── */
  useEffect(() => {
    if (!workerId) return setTasks([]);
    fetchTasksByWorker(workerId).then(setTasks);
  }, [workerId]);


  /* ─────────── live: периодический поллинг списка работников ─────────── */
  useEffect(() => {
    if (mode !== "live") return;

    const load = async () => setWorkers(await fetchWorkers());
    load();
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [mode]);

  /* ─────────── helpers ─────────── */
  const resetFilters = () => {
    setPositions([]);
    setTaskId("");

    const today = new Date();
    setDateFrom(formatDate(today));
    setDateTo(formatDate(today));
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    resetFilters();
    if (m !== "live") setLoading(true);
  };

  /* ─────────── UI ─────────── */
  return (
    <Box>
      <Heading size="md" mb={4}>
        Отчёты
      </Heading>

      {/* ───────────── Фильтры ───────────── */}
      <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50" mb={6}>
        <Heading size="sm" mb={3}>
          Фильтры
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {/* режим */}
          <FormControl>
            <FormLabel>Вид отчёта</FormLabel>
            <ModeSelectMenu value={mode} onChange={handleModeChange} />
          </FormControl>

          {/* сотрудник */}
          <FormControl>
            <FormLabel>Сотрудник</FormLabel>
            <WorkerSelectMenu
              workers={workers}
              value={workerId}
              onChange={(id) => {
                setWorkerId(id);
                setTaskId("");
                setPositions([]);
              }}
            />
          </FormControl>

          {/* задача */}
          {mode === "task" && (
            <FormControl>
              <FormLabel>Задача</FormLabel>
              <Select
                placeholder="Выберите задачу"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
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

          {/* даты для 'period' */}
          {mode === "period" && (
            <>
              <FormControl>
                <FormLabel>С даты</FormLabel>
                <DatePicker value={dateFrom} onChange={setDateFrom} />
              </FormControl>
              <FormControl>
                <FormLabel>По дату</FormLabel>
                <DatePicker value={dateTo} onChange={setDateTo} />
              </FormControl>
            </>
          )}
        </SimpleGrid>
      </Box>

      {/* ───────────── Карта + другие блоки ───────────── */}
      <Box mt={8}>
        <MapReport
          mode={mode}
          workerId={workerId}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />

        <WorkerStatsReport noHeading />
        <TasksSummaryReport noHeading />
      </Box>
    </Box>
  );
}
function setPositions(arg0: never[]) {
  throw new Error("Function not implemented.");
}

function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

