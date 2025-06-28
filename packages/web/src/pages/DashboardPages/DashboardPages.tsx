
import TasksTable from "../Tasks/TasksTable";
import WorkersTable from "../Workers/WorkersTable";
import UnifiedReportsPage from "../Tracking/UnifiedReportsPage";

export default function DashboardPages({ page }: { page: string }) {
  if (page === "tasks") return <TasksTable />;
  if (page === "workers") return <WorkersTable />;
  if (page === "reports") return <UnifiedReportsPage />;
  return null;
}
