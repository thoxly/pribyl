import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Divider,
} from "@chakra-ui/react";

type Company = {
  _id: string;
  name: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
};

type CompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
};

export default function CompanyModal({ isOpen, onClose, company }: CompanyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Моя компания</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {company ? (
            <VStack spacing={4} align="start">
              <Box>
                <Text fontWeight="bold">Наименование:</Text>
                <Text>{company.name}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold">ИНН:</Text>
                <Text>{company.inn || "—"}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold">КПП:</Text>
                <Text>{company.kpp || "—"}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold">ОГРН:</Text>
                <Text>{company.ogrn || "—"}</Text>
              </Box>

              <Divider />

              <Box fontSize="sm" color="gray.500">
                ID компании: {company._id}
              </Box>
            </VStack>
          ) : (
            <Text>Загрузка компании...</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
