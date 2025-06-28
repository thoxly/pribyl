import { Flex, Text, Box } from "@chakra-ui/react";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <Flex
      as="header"
      px={6}
      py={4}
      borderBottom="1px solid #E2E8F0"
      bg="white"
      align="center"
    >
      <Text fontWeight="bold" fontSize="lg">
        Прибыл
      </Text>

      <Box ml="auto">
        <UserMenu />
      </Box>
    </Flex>
  );
}
