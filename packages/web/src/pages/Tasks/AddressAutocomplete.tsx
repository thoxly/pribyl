// components/AddressAutocomplete.tsx
import { Box, Input, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { fetchYandexSuggestions } from "../../utils/fetchYandexSuggestions";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Автодополнение адреса, которое показывает подсказки
 * только после явного взаимодействия пользователя (клик/ввод).
 */
export default function AddressAutocomplete({ value, onChange }: Props) {
  const [query, setQuery]           = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlight, setHighlight]   = useState(-1);

  /** Был ли клик в поле – используем, чтобы не показывать подсказки «сразу» */
  const activatedRef = useRef(false);
  const debounceId   = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* — синхронизируемся с внешним value, но без автопоказа подсказок — */
  useEffect(() => setQuery(value), [value]);

  /* — фетчим подсказки только если пользователь уже взаимодействовал — */
  useEffect(() => {
    if (!activatedRef.current) return;            // ключевая проверка
    if (!query.trim()) { setSuggestions([]); return; }

    if (debounceId.current) clearTimeout(debounceId.current);
    debounceId.current = setTimeout(() => {
      fetchYandexSuggestions(query).then((arr) =>
        setSuggestions(Array.from(new Set(arr)))
      );
    }, 250);
  }, [query]);

  /* ---- фокус / блюр ---- */
  const handleMouseDown = () => { activatedRef.current = true; };

  const handleFocus = () => {
    if (activatedRef.current && query.trim()) {
      fetchYandexSuggestions(query).then((arr) =>
        setSuggestions(Array.from(new Set(arr)))
      );
    }
  };

  const handleBlur = () => {
    activatedRef.current = false;
    setSuggestions([]);
    setHighlight(-1);
  };

  /* ---- клавиатура ---- */
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const sel =
        suggestions.length > 0
          ? suggestions[highlight >= 0 ? highlight : 0]
          : query;

      setQuery(sel);
      setSuggestions([]);
      setHighlight(-1);
      onChange(sel);
    }
  };

  /* ---- UI ---- */
  return (
    <Box position="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onMouseDown={handleMouseDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Начните вводить адрес…"
        autoComplete="off"
      />

      {!!suggestions.length && (
        <Box
          position="absolute"
          bg="white"
          border="1px solid #d5d5d5"
          borderRadius="md"
          w="100%"
          zIndex={5}
          mt={1}
          maxH="180px"
          overflowY="auto"
        >
          <VStack align="stretch" spacing={0}>
            {suggestions.map((s, i) => (
              <Box
                key={s}
                px={3}
                py={2}
                bg={i === highlight ? "gray.100" : "white"}
                _hover={{ bg: "gray.200", cursor: "pointer" }}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();     // чтобы фокус не ушёл
                  setQuery(s);
                  setSuggestions([]);
                  setHighlight(-1);
                  onChange(s);
                }}
              >
                {s}
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
