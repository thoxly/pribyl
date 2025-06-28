import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Button,
  Box,
  Avatar,
  HStack,
  IconButton,
  useDisclosure,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { EditIcon, DeleteIcon, CheckIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import StatusBadge from "../StatusBadge";
import TaskDrawer from "./TaskDrawer";
import { useTaskUpdates } from "../../hooks/useTaskUpdates"; 

// Тип задачи с populated workerId
interface PopulatedTask {
  _id: string;
  title: string;
  address?: string;
  workerId?: {
    _id: string;
    fullName: string;
    photoUrl?: string;
  };
status:
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "overdue"
    | "needs_rework"
    | "done"
    | "cancelled";
  dateStart?: string;
  deadline?: string;
  description?: string;
  createdBy?: { name: string; id: string };
  requiresVerification?: boolean;

}

interface TaskFormData {
  _id?: string;
  title: string;
  address?: string;
  workerId?: string;
  status:
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "overdue"
    | "needs_rework"
    | "done"
    | "cancelled";
  dateStart?: string;
  deadline?: string;
  description?: string;
  createdBy?: { name: string; id: string };
  requiresVerification?: boolean;
}
/**
 * Преобразует ISO‑строку в формат dd.MM.yyyy HH:mm (локаль – ru).
 * Возвращает «-», если дата не передана или парсинг не удался.
 */
const formatDate = (iso?: string): string => {
  if (!iso) return "-";
  try {
    return format(new Date(iso), "dd.MM.yyyy HH:mm", { locale: ru });
  } catch {
    return "-";
  }
};

export default function TasksTable() {
  const [tasks, setTasks] = useState<PopulatedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<PopulatedTask | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/tasks", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.status === 403) {
          setTasks([]);
          setLoading(false);
          console.warn("Нет доступа к задачам: компания не определена");
          return;
        }

        if (!response.ok) {
          throw new Error("Ошибка при получении задач");
        }

        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Ошибка загрузки задач:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleAddTask = () => {
    setSelectedTask(null);
    onOpen();
  };

  const handleEditTask = (task: PopulatedTask) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleSaveTask = async (task: Partial<TaskFormData>) => {
    try {
      const url = selectedTask
        ? `/api/tasks/${selectedTask._id}`
        : "/api/tasks";
      const method = selectedTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) throw new Error("Failed to save task");
      const savedTask = await response.json();

      if (selectedTask) {
        setTasks((prev) =>
          prev.map((t) => (t._id === selectedTask._id ? savedTask : t))
        );
      } else {
        setTasks((prev) => [...prev, savedTask]);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleConfirmTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "done" }),
      });

      if (!response.ok) throw new Error("Failed to confirm task");

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (error) {
      console.error("Error confirming task:", error);
    }
  };

  useTaskUpdates(async (taskId) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) throw new Error("Ошибка получения обновлённой задачи");
    const updatedTask = await response.json();

    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? updatedTask : t))
    );
  } catch (err) {
    console.error("Ошибка при обновлении задачи через WS:", err);
  }
});

  return (
    <>
      <Flex justify="flex-end" mb={4}>
        <Button colorScheme="purple" onClick={handleAddTask}>
          + Новая задача
        </Button>
      </Flex>

      {loading ? (
        <Box textAlign="center" mt={10}>
          <Spinner size="lg" color="purple.500" />
        </Box>
      ) : tasks.length === 0 ? (
        <Box textAlign="center" mt={10} color="gray.500">
          Пока нет задач. Добавьте новую.
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Задача</Th>
              <Th>Адрес</Th>
              <Th>Воркер</Th>
              <Th>Статус</Th>
              <Th>Начало</Th>
              <Th>Дедлайн</Th>
              <Th>Действия</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tasks.map((task) => (
              <Tr
                key={task._id}
                bg={task.status === "completed" ? "yellow.50" : undefined}
              >
                <Td>{task.title}</Td>
                <Td>{task.address || "-"}</Td>
                <Td>
                  {task.workerId ? (
                    <HStack>
                      <Avatar
                        size="xs"
                        name={task.workerId.fullName}
                        src={task.workerId.photoUrl}
                      />
                      <Box>{task.workerId.fullName}</Box>
                    </HStack>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td>
                  <StatusBadge status={task.status} />
                </Td>
                <Td>
                  <Tooltip
                    label={
                      task.dateStart
                        ? new Date(task.dateStart).toLocaleString("ru-RU")
                        : undefined
                    }
                    hasArrow
                  >
                    <Box>{formatDate(task.dateStart)}</Box>
                  </Tooltip>
                </Td>
                <Td>
                  <Tooltip
                    label={
                      task.deadline
                        ? new Date(task.deadline).toLocaleString("ru-RU")
                        : undefined
                    }
                    hasArrow
                  >
                    <Box>{formatDate(task.deadline)}</Box>
                  </Tooltip>
                </Td>
                <Td>
                  <HStack>
                    <IconButton
                      aria-label="Edit task"
                      icon={<EditIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTask(task)}
                    />
                    <IconButton
                      aria-label="Delete task"
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      color="red.500"
                      onClick={() => handleDeleteTask(task._id)}
                    />
                    {task.status === "completed" && (
                      <IconButton
                        aria-label="Подтвердить выполнение"
                        icon={<CheckIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="green"
                        onClick={() => handleConfirmTask(task._id)}
                      />
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <TaskDrawer
        isOpen={isOpen}
        onClose={onClose}
        task={selectedTask}
        onSave={handleSaveTask}
      />
    </>
  );
}
