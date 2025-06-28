import {
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import useUser from "../hooks/useUser";
import ProfileModal from "../pages/ProfileModal";
import CompanyModal from "../pages/CopmanyModal";
import { useEffect, useState } from "react";

export default function UserMenu() {
  const { user, loading } = useUser();
  const {
    isOpen: isProfileOpen,
    onOpen: openProfile,
    onClose: closeProfile,
  } = useDisclosure();
  const {
    isOpen: isCompanyOpen,
    onOpen: openCompany,
    onClose: closeCompany,
  } = useDisclosure();

  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/my-company", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      }
    };

    if (isCompanyOpen) fetchCompany();
  }, [isCompanyOpen]);

  if (loading) return <Spinner />;
  if (!user) return null;

  return (
    <>
      <Menu>
        <MenuButton>
          <Avatar size="sm" name={user.fullName} src={user.photoUrl} />
          <span style={{ marginLeft: 8 }}>{user.fullName}</span>
        </MenuButton>

        <MenuList>
          <MenuItem onClick={openProfile}>Профиль</MenuItem>
          <MenuItem onClick={openCompany}>Моя компания</MenuItem>
          <MenuItem>Выход</MenuItem>
        </MenuList>
      </Menu>

      <ProfileModal isOpen={isProfileOpen} onClose={closeProfile} user={user} />
      <CompanyModal isOpen={isCompanyOpen} onClose={closeCompany} company={company} />
    </>
  );
}
