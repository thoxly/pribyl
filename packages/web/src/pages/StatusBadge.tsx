import { Badge } from "@chakra-ui/react";

type StatusType = "draft" | "in‑progress" | "done";

const map: Record<StatusType, { text: string; color: string }> = {
  draft: { text: "Новая", color: "gray" },
  "in‑progress": { text: "В работе", color: "orange" },
  done: { text: "Завершена", color: "green" },
};

export default function StatusBadge({ status }: { status: string }) {
  const fallback = { text: status, color: "gray" };
  const { text, color } = (map as Record<string, typeof fallback>)[status] || fallback;
  return <Badge colorScheme={color}>{text}</Badge>;
}


