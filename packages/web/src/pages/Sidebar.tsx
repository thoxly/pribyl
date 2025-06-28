import { Box, VStack, Button } from "@chakra-ui/react";

type PageKey = "tasks" | "workers" | "reports";

type SidebarProps = {
  activePage: PageKey;
  onSelect: (page: PageKey) => void;
};

const menu: { key: PageKey; label: string }[] = [
  { key: "tasks", label: "Задачи" },
  { key: "workers", label: "Воркеры" },
  { key: "reports", label: "Отчёты" },
];

export default function Sidebar({ activePage, onSelect }: SidebarProps) {
  return (
    <Box w="200px" p={4} bg="white" boxShadow="md">
      <VStack spacing={3} align="stretch">
        {menu.map((item) => (
          <Button
            key={item.key}
            variant={activePage === item.key ? "solid" : "ghost"}
            colorScheme="purple"
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </VStack>
    </Box>
  );
}
