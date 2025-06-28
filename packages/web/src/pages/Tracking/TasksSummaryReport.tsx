import { Box, Heading, Text } from "@chakra-ui/react";

export default function TasksSummaryReport({ noHeading }: { noHeading?: boolean }) {
  return (
    <Box>
{!noHeading && <Heading size="md" mb={2}>Сводка по задачам</Heading>}

      <Text fontSize="sm" color="gray.500" mb={4}>
        Здесь будет сводный отчёт по статусам задач, среднему времени выполнения и другим метрикам.
      </Text>
      <Box h="40vh" bg="gray.100" borderRadius="lg" />
    </Box>
  );
}


