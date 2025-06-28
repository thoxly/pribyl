import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Button,
  Avatar,
  Box,
  HStack,
  Badge,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import CreateWorkerModal from "./CreateWorkerModal";
import useUser from "../../hooks/useUser";

type Worker = {
  _id: string;
  fullName: string;
  photoUrl: string;
  inviteCode: string;
  onboardingCompleted: boolean;
  status?: "active" | "pending";
  companyId: string | null;
};

export default function WorkersTable() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
  setLoading(true);
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/workers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 403) {
      console.warn("Нет доступа: компания не указана");
      setWorkers([]);
      return;
    }

    if (!res.ok) {
      throw new Error("Ошибка при загрузке сотрудников");
    }

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

  console.log("🔍 company из user:", user?.company);

  return (
    <>
      <Flex justify="flex-end" mb={4}>
        <Button colorScheme="purple" onClick={onOpen}>
          + Добавить воркера
        </Button>
      </Flex>
      {loading ? (
        <Box textAlign="center" mt={10}>
          <Spinner size="lg" color="purple.500" />
        </Box>
      ) : workers.length === 0 ? (
        <Box textAlign="center" mt={10} color="gray.500">
          Пока нет сотрудников. Добавьте новых.
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Имя</Th>
              <Th>Инвайт-код</Th>
              <Th>Статус</Th>
            </Tr>
          </Thead>
          <Tbody>
            {workers.map((w) => (
              <Tr key={w._id}>
                <Td>
                  <HStack>
                    <Avatar
                      size="sm"
                      src={w.photoUrl || undefined}
                      name={w.fullName || "—"}
                    />
                    <Box>
                      {w.fullName ? (
                        w.fullName
                      ) : (
                        <Box as="span" color="gray.500">
                          Ожидается
                        </Box>
                      )}
                    </Box>
                  </HStack>
                </Td>
                <Td>
                  <Box fontFamily="mono">{w.inviteCode}</Box>
                </Td>
                <Td>
                  <Badge
                    colorScheme={w.status === "active" ? "green" : "yellow"}
                  >
                    {w.status === "active" ? "Активен" : "Ожидает"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {user?.company?._id && (
        <CreateWorkerModal
          isOpen={isOpen}
          onClose={onClose}
          companyId={user.company._id}
          onWorkerCreated={fetchWorkers}
        />
      )}
    </>
  );
}
