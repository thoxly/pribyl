import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Input,
  VStack,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CreateWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onWorkerCreated?: () => void;
}

export default function CreateWorkerModal({
  isOpen,
  onClose,
  companyId,
  onWorkerCreated,
}: CreateWorkerModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && companyId) {
      const newCode = generateCode();
      setCode(newCode);
    } else {
      setCode("");
    }
  }, [isOpen, companyId]);

  const generateCode = () => {
    return crypto
      .getRandomValues(new Uint8Array(3))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, "0"), "")
      .toUpperCase();
  };

  const handleSendTelegram = async () => {
    setLoading(true);
    try {
      const newCode = generateCode();
      setCode(newCode);

      // сначала отправляем в Telegram
      const text = encodeURIComponent(
        `Привет! Ваш код авторизации:\n${newCode}\n\nПерейдите в бота 👉 @arrived_rf_bot и нажмите "Start".\nБот попросит ввести код — введите его, чтобы подключиться к системе.`
      );
      const tgLink = `tg://msg_url?url=&text=${text}`;
      const shareLink = `https://t.me/share/url?url=&text=${text}`;
      window.location.href = tgLink;
      setTimeout(() => window.open(shareLink, "_blank"), 500);
      const token = localStorage.getItem("token");
      // потом создаём воркера в базе
      const res = await fetch("/api/create-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          code: newCode,
        }),
      });

      if (!res.ok) throw new Error("Ошибка при создании воркера");

      onWorkerCreated?.();
      onClose();
    } catch (e) {
      toast({
        title: "Ошибка при создании воркера",
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Добавление воркера</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Spinner />
          ) : (
            <VStack spacing={4} align="stretch">
              <Text>
                Отправьте этот код сотруднику — он введёт его в Telegram-боте.
              </Text>
              <Input
                value={code}
                isReadOnly
                textAlign="center"
                fontSize="xl"
                fontWeight="bold"
              />
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSendTelegram}
            isDisabled={!code}
          >
            Отправить в Telegram
          </Button>
          <Button ml={3} onClick={onClose}>
            Закрыть
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
