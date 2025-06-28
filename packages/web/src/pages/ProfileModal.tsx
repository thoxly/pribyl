import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Avatar,
  VStack,
  Text,
  Box,
  Divider,
} from "@chakra-ui/react";

export type Company = {
  _id: string;
  name: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
};

type User = {
  _id: string;
  telegramId: number;
  fullName: string;
  role: string;
  company: Company | null;
};

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
};

export default function ProfileModal({
  isOpen,
  onClose,
  user,
}: ProfileModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Профиль</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="start">
            <Avatar size="xl" name={user.fullName} />

            <Box>
              <Text fontWeight="bold">ФИО:</Text>
              <Text>{user.fullName}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold">Telegram ID:</Text>
              <Text>{user.telegramId}</Text>
            </Box>

            <Box>
              <Text fontWeight="bold">Роль:</Text>
              <Text>
                {user.role === "admin" ? "Администратор" : "Сотрудник"}
              </Text>
            </Box>

            <Box>
              <Text fontWeight="bold">Компания:</Text>
              <Text>{user.company?.name ?? "Не привязан"}</Text>
            </Box>

            <Divider />

            <Box fontSize="sm" color="gray.500">
              ID пользователя: {user._id}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
