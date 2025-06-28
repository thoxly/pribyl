import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useMemo } from "react";

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: .3; }
`;

export interface Worker {
  _id: string;
  fullName: string;
  liveLocation?: {
    active: boolean;
    lastSeen?: Date | string;
  };
  // ↓ приходят из /workers/live - оставляем для совместимости
  liveLocationActive?: boolean;
  lastSeen?: Date | string;
}

interface Props {
  workers: Worker[];
  value: string;
  onChange: (id: string) => void;
}

export default function WorkerSelectMenu({ workers, value, onChange }: Props) {
  const currentLabel = useMemo(() => {
    if (!value) return "Все сотрудники";
    return workers.find((w) => w._id === value)?.fullName ?? "-";
  }, [value, workers]);

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        w="100%"
        textAlign="left"
      >
        {currentLabel}
      </MenuButton>

      <MenuList maxH="320px" overflowY="auto" w="100%">
        <MenuOptionGroup
          value={value}
          type="radio"
          onChange={(id) => onChange(id as string)}
        >
          <MenuItemOption value="">Все сотрудники</MenuItemOption>

          {workers.map((w) => {
            /* --- Fallback для старого/нового формата --- */
            const isOnline = Boolean(
              w.liveLocation?.active ?? w.liveLocationActive
            );

            const lastSeenDate = w.liveLocation?.lastSeen
              ? new Date(w.liveLocation.lastSeen)
              : w.lastSeen
              ? new Date(w.lastSeen)
              : undefined;

            return (
              <MenuItemOption key={w._id} value={w._id}>
                <HStack align="start" spacing={3}>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={isOnline ? "green.400" : "gray.400"}
                    animation={isOnline ? `${blink} 1.4s infinite` : undefined}
                    mt={1}
                  />
                  <VStack align="flex-start" spacing={0}>
                    <Text>{w.fullName}</Text>

                    {!isOnline && lastSeenDate && (
                      <Text fontSize="xs" color="gray.500">
                        был(а){" "}
                        {formatDistanceToNow(lastSeenDate, {
                          locale: ru,
                          addSuffix: true,
                        })}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </MenuItemOption>
            );
          })}
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  );
}
