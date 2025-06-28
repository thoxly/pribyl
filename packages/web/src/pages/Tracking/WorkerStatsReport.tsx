import { Box, Heading, Text } from "@chakra-ui/react";

export default function WorkerStatsReport({ noHeading }: { noHeading?: boolean }) {
  return (
    <Box mt={6}>
      {!noHeading && <Heading size="md" mb={2}>Статистика по сотруднику</Heading>}
      <Text fontSize="sm" color="gray.500" mb={4}>
        Здесь будет таблица с количеством задач, временем выполнения и маршрутом за период.
      </Text>
      <Box h="40vh" bg="gray.100" borderRadius="lg" />
    </Box>
  );
}

