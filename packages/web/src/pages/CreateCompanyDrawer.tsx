import { useEffect, useState } from "react";
import {
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, Button, Input, useToast
} from "@chakra-ui/react";
import useUser from "../hooks/useUser";

export default function CreateCompanyDrawer() {
  const { user } = useUser(); // 👈 подключаем
  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setIsOpen(true);
    }
  }, [user]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/create-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, inn, kpp, ogrn }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "Компания создана", status: "success" });
      setIsOpen(false);
      window.location.reload();
    } catch {
      toast({ title: "Ошибка создания компании", status: "error" });
    }
  };

  if (!isOpen) return null;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={() => setIsOpen(false)}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Создание компании</DrawerHeader>
        <DrawerBody>
          <Input placeholder="Название компании" value={name} onChange={(e) => setName(e.target.value)} mb={3} />
          <Input placeholder="ИНН" value={inn} onChange={(e) => setInn(e.target.value)} mb={3} />
          <Input placeholder="КПП" value={kpp} onChange={(e) => setKpp(e.target.value)} mb={3} />
          <Input placeholder="ОГРН" value={ogrn} onChange={(e) => setOgrn(e.target.value)} mb={4} />
          <Button colorScheme="purple" onClick={handleCreate} isDisabled={!name}>
            Создать
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
