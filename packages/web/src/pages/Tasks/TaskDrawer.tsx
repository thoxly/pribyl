import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Text,
  HStack,
  Avatar,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import WorkerSelect from "./WorkerSelect";
import DatePicker from "./DatePicker";
import { Switch } from "@chakra-ui/react";

interface Task {
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
  createdBy?: {
    name: string;
    id: string;
    photoUrl?: string;
  };

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

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onSave: (task: Partial<TaskFormData>) => void;
}

export default function TaskDrawer({
  isOpen,
  onClose,
  task,
  onSave,
}: TaskDrawerProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    status: "assigned",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        _id: task._id,
        title: task.title,
        address: task.address,
        workerId:
          typeof task.workerId === "object" ? task.workerId._id : task.workerId,
        status: task.status,
        dateStart: task.dateStart,
        deadline: task.deadline
          ? new Date(task.deadline).toISOString()
          : undefined,
        description: task.description,
        createdBy:
          typeof task.createdBy === "object"
            ? { name: task.createdBy.fullName, id: task.createdBy._id }
            : undefined,
      });
    } else {
      setFormData({ title: "", status: "assigned" });
    }
  }, [task]);

  const handleChange = (
    field: keyof Task,
    value: string | { name: string; avatar: string; id: string }
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
    setFormData({ title: "", status: "assigned" });
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
      /* initialFocusRef удалён, чтобы фокус нигде не ставился автоматически */
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          {task ? "Редактировать задачу" : "Новая задача"}
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Название задачи</FormLabel>
              <Input
                ref={titleRef}
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Введите название"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Адрес</FormLabel>
              <AddressAutocomplete
                value={formData.address || ""}
                onChange={(val) => handleChange("address", val)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Назначенный воркер</FormLabel>
              <WorkerSelect
                value={formData.workerId || ""}
                onChange={(val) => handleChange("workerId", val)}
              />
            </FormControl>
            <HStack spacing={4} w="100%">
              <FormControl flex={1}>
                <FormLabel>Когда нужно начать выполнение задачи</FormLabel>
                <DatePicker
                  value={formData.dateStart || ""}
                  onChange={(val) => handleChange("dateStart", val)}
                  placeholder="Выберите дату начала"
                />
              </FormControl>

              <FormControl flex={1}>
                <FormLabel>Когда задача должна быть выполнена</FormLabel>
                <DatePicker
                  value={formData.deadline || ""}
                  onChange={(val) => handleChange("deadline", val)}
                  placeholder="Укажите крайний срок"
                />
              </FormControl>
            </HStack>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="requiresVerification" mb="0">
                Требует проверки после выполнения
              </FormLabel>
              <Switch
                id="requiresVerification"
                colorScheme="purple"
                isChecked={formData.requiresVerification || false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiresVerification: e.target.checked,
                  }))
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Описание</FormLabel>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Дополнительный комментарий"
              />
            </FormControl>

            {formData.createdBy && (
              <FormControl>
                <FormLabel>Создано</FormLabel>
                <HStack>
                  <Avatar
                    size="xs"
                    name={formData.createdBy.name}
                    src={formData.createdBy.photoUrl}
                  />
                  <Text>{formData.createdBy.name}</Text>
                </HStack>
              </FormControl>
            )}
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Отмена
          </Button>
          <Button colorScheme="purple" onClick={handleSubmit}>
            Сохранить
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
