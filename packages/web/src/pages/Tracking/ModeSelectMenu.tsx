// components/Reports/ModeSelectMenu.tsx
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import type { Mode } from "./UnifiedReportsPage";

interface Props {
  value: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeSelectMenu({ value, onChange }: Props) {
  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        w="100%" // обеспечит ширину по родительскому контейнеру (например, FormControl)
        textAlign="left"
      >
        {{
          live: "Live",
          period: "История за период",
          task: "По задаче",
        }[value]}
      </MenuButton>

      <MenuList w="100%"> {/* 👈 здесь также важно использовать w="100%" */}
        <MenuOptionGroup
          type="radio"
          value={value}
          onChange={(val) => onChange(val as Mode)}
        >
          <MenuItemOption value="live">Live</MenuItemOption>
          <MenuItemOption value="period">История за период</MenuItemOption>
          <MenuItemOption value="task">По задаче</MenuItemOption>
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  );
}
