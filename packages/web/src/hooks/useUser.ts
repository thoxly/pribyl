// useUser.ts
import { useEffect, useState } from "react";

export type Company = {
  _id: string;
  name: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
};


export type User = {
  _id: string;
  telegramId: number;
  fullName: string;
  role: "admin" | "worker";
  photoUrl?: string;
  username?: string;
  onboardingCompleted: boolean;
  company: Company | null;
};

export default function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setLoading(false);

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return { user, loading };
}
