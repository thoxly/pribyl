import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Avatar,
  HStack,
  Text,
  Spinner,
  Box,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import CreateWorkerModal from "../Workers/CreateWorkerModal"; // путь адаптируй, если нужно
import useUser from "../../hooks/useUser";

interface Worker {
  _id: string;
  fullName: string;
  photoUrl?: string;
  status: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  companyId?: string;
}

export default function WorkerSelect({ value, onChange, companyId }: Props) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const effectiveCompanyId = companyId ?? user?.company?._id;

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/workers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWorkers(data);
    } catch (error) {
      console.error("Ошибка загрузки воркеров:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const activeWorkers = workers.filter((worker) => worker.status === "active");
  const selectedWorker = activeWorkers.find((w) => w._id === value);

  if (loading) return <Spinner size="sm" />;

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          size="md"
          variant="outline"
          rightIcon={<ChevronDownIcon boxSize={4} />}
          w="100%"
        >
          <HStack justify="flex-start">
            {selectedWorker ? (
              <>
                <Avatar
                  size="xs"
                  name={selectedWorker.fullName}
                  src={selectedWorker.photoUrl}
                />
                <Text>{selectedWorker.fullName}</Text>
              </>
            ) : (
              <HStack>
                <Avatar size="xs" />
                <Text color="gray.500">Выбрать</Text>
              </HStack>
            )}
          </HStack>
        </MenuButton>
        <MenuList maxH="300px" overflowY="auto">
          {activeWorkers.length === 0 ? (
            <Box px={4} py={2} color="gray.500">
              Нет доступных сотрудников
              <Button
                size="sm"
                mt={2}
                colorScheme="blue"
                onClick={onOpen}
                width="100%"
              >
                Добавить сотрудника
              </Button>
            </Box>
          ) : (
            <>
              {activeWorkers.map((worker) => (
                <MenuItem
                  key={worker._id}
                  onClick={() => onChange(worker._id)}
                  _hover={{ bg: "gray.100" }}
                >
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      name={worker.fullName}
                      src={worker.photoUrl}
                    />
                    <Box>
                      <Text fontSize="sm">{worker.fullName}</Text>
                    </Box>
                  </HStack>
                </MenuItem>
              ))}
              <MenuItem onClick={onOpen} color="purple.500" fontWeight="semibold">
                + Добавить сотрудника
              </MenuItem>
            </>
          )}
        </MenuList>
      </Menu>

      <CreateWorkerModal
        isOpen={isOpen}
        onClose={onClose}
        companyId={effectiveCompanyId}
        onWorkerCreated={fetchWorkers}
      />
    </>
  );
}
