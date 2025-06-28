import { useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Container,
  useColorModeValue,
  Image,
  Center,
  Stack,
} from "@chakra-ui/react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

const Login = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?7";
    script.setAttribute("data-telegram-login", "arrived_rf_bot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    const container = document.getElementById("telegram-button");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
    }

    container?.appendChild(script);

    window.onTelegramAuth = async (user: any) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          window.location.href = "/dashboard";
        } else {
          alert("Ошибка авторизации");
        }
      } catch (err) {
        alert("Ошибка подключения к серверу");
      }
    };
  }, []);

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue("gray.100", "gray.900")}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Container maxW="md" bg="white" p={10} borderRadius="2xl" boxShadow="2xl">
        <VStack spacing={6}>
          <Image src="/logo.svg" alt="Логотип" boxSize="80px" />
          <Heading textAlign="center" size="lg">
            Добро пожаловать в <br />{" "}
            <Text as="span" color="purple.500">
              Прибыл.рф
            </Text>
          </Heading>
          <Text fontSize="md" color="gray.500" textAlign="center">
            Умный контроль выездных сотрудников. Без паролей. Без лишнего.
          </Text>

          <Center pt={4} id="telegram-button" />

          <Stack pt={6}>
            <Text fontSize="xs" color="gray.400" textAlign="center">
              Авторизуясь, вы соглашаетесь с условиями обработки данных.
            </Text>
          </Stack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
