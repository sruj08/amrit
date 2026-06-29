import { Outlet } from "react-router-dom";
import { TopHeader } from "./TopHeader";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { ContextPanel } from "./ContextPanel";
import { PanelProvider } from "./PanelContext";

export function AppShell() {
  return (
    <PanelProvider>
      <div className="h-screen flex flex-col bg-bg-primary text-text-primary overflow-hidden">
        <TopHeader />
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
            <Outlet />
          </main>
          <ContextPanel />
        </div>
        <StatusBar />
      </div>
    </PanelProvider>
  );
}
