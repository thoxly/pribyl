import { useState } from "react";
import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "../Sidebar";
import DashboardPages from "./DashboardPages";
import Header from "../Header";
import CreateCompanyDrawer from "../CreateCompanyDrawer"; 


type PageKey = "tasks" | "workers" | "reports";

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState<PageKey>("tasks");

  return (
    <>
      <Flex direction="column" h="100vh">
        <Header />
        <Flex flex="1" overflow="hidden">
          <Sidebar activePage={activePage} onSelect={setActivePage} />

          <Box as="main" flex="1" p={6} overflow="auto" bg="gray.50">
            <DashboardPages page={activePage} />
          </Box>
        </Flex>
      </Flex>


      <CreateCompanyDrawer />
    </>
  );
}
