import {
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Tooltip,
  VisuallyHidden,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useEffect, useState, useRef } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const [showTime, setShowTime] = useState<boolean>(value.includes("T"));
  const [dateTime, setDateTime] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDateTime(value);
    setShowTime(value.includes("T"));
  }, [value]);

  const handleChange = (newValue: string) => {
    setDateTime(newValue);
    onChange(newValue);
  };

  const toggleTime = () => {
    if (showTime) {
      // ➜ «Убрать время» → сохранить только дату
      const [date] = dateTime.split("T");
      handleChange(date || "");
    } else {
      // ➜ «Добавить время» → сохраняем выбранную дату и добавляем дефолтное время 12:00
      const baseDate = dateTime.split("T")[0] || new Date().toISOString().slice(0, 10);
      handleChange(`${baseDate}T12:00`);
    }
    setShowTime(!showTime);

    // Если открываем time‑mode — сразу вызовем пикер времени, чтобы пользователь не делал лишний клик
    setTimeout(() => openNativePicker(), 0);
  };

  const clearDateTime = () => handleChange("");

  /**
   * Вызывает нативный пикер (если браузер поддерживает showPicker()).
   */
  const openNativePicker = () => {
    if (inputRef.current && typeof (inputRef.current as any).showPicker === "function") {
      (inputRef.current as any).showPicker();
    }
  };

  return (
    <>
      <InputGroup size="md">
        <Input
          ref={inputRef}
          type={showTime ? "datetime-local" : "date"}
          value={
            showTime ? dateTime?.slice(0, 16) || "" : dateTime?.slice(0, 10) || ""
          }
          onChange={(e) => handleChange(e.target.value)}
          onFocus={openNativePicker}
          onClick={openNativePicker}
          bg="white"
          borderColor="gray.300"
          _hover={{ borderColor: "purple.500" }}
          _focus={{
            borderColor: "purple.500",
            boxShadow: "0 0 0 1px purple.500",
          }}
          placeholder={
            placeholder || (showTime ? "дд.мм.гггг чч:мм" : "дд.мм.гггг")
          }
        />

        {dateTime && (
          <InputRightElement>
            <Tooltip label="Очистить">
              <Button
                size="sm"
                variant="ghost"
                colorScheme="purple"
                onClick={clearDateTime}
              >
                <VisuallyHidden>Очистить</VisuallyHidden>
                <CloseIcon boxSize={2.5} />
              </Button>
            </Tooltip>
          </InputRightElement>
        )}
      </InputGroup>

      {/* Time toggle helper */}
      <Button
        onClick={toggleTime}
        variant="link"
        size="xs"
        mt={1}
        colorScheme="purple"
      >
        {showTime ? "Убрать время" : "Добавить время"}
      </Button>
    </>
  );
}
