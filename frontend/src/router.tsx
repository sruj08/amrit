import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import MissionOverview from "./pages/MissionOverview";
import MissionTimeline from "./pages/MissionTimeline";
import DFSARProcessing from "./pages/DFSARProcessing";
import TerrainIntelligence from "./pages/TerrainIntelligence";
import Polarimetry from "./pages/Polarimetry";
import IceLikelihood from "./pages/IceLikelihood";
import DecisionLayer from "./pages/DecisionLayer";
import LandingSites from "./pages/LandingSites";
import TraversePlanner from "./pages/TraversePlanner";
import ResourceIntelligence from "./pages/ResourceIntelligence";
import Validation from "./pages/Validation";
import MissionReport from "./pages/MissionReport";
import Settings from "./pages/Settings";
import ActivityLogs from "./pages/ActivityLogs";
import DeveloperMode from "./pages/DeveloperMode";
import SystemDiagnostics from "./pages/SystemDiagnostics";
import NotFound from "./pages/NotFound";

// Full 16-page information architecture (PRD section 3.1).
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <MissionOverview /> }, // P01
      { path: "mission/timeline", element: <MissionTimeline /> }, // P02
      { path: "pipeline/dfsar", element: <DFSARProcessing /> }, // P03
      { path: "pipeline/terrain", element: <TerrainIntelligence /> }, // P04
      { path: "polarimetry", element: <Polarimetry /> }, // P05
      { path: "likelihood", element: <IceLikelihood /> }, // P06
      { path: "decision", element: <DecisionLayer /> }, // P07
      { path: "landing", element: <LandingSites /> }, // P08
      { path: "traverse", element: <TraversePlanner /> }, // P09
      { path: "resources", element: <ResourceIntelligence /> }, // P10
      { path: "validation", element: <Validation /> }, // P11
      { path: "report", element: <MissionReport /> }, // P12
      { path: "settings", element: <Settings /> }, // P13
      { path: "logs", element: <ActivityLogs /> }, // P14
      { path: "dev", element: <DeveloperMode /> }, // P15
      { path: "diagnostics", element: <SystemDiagnostics /> }, // P16
      { path: "*", element: <NotFound /> },
    ],
  },
]);
