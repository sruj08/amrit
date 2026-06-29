import { NavLink } from "react-router-dom";
import {
  Globe, Clock, GitBranch, Mountain, Activity, Droplets, Target, Award,
  Route, Boxes, BarChart2, FileText, Settings, ScrollText, Code2, HeartPulse,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Globe;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

// Full information architecture (PRD section 3.2). MVP pages are marked ready;
// the rest navigate to a roadmap placeholder so the shell is complete.
const GROUPS: NavGroup[] = [
  {
    title: "Mission",
    items: [
      { to: "/", label: "Overview", icon: Globe },
      { to: "/mission/timeline", label: "Timeline", icon: Clock },
    ],
  },
  {
    title: "Pipelines",
    items: [
      { to: "/pipeline/dfsar", label: "DFSAR Processing", icon: GitBranch },
      { to: "/pipeline/terrain", label: "Terrain Intelligence", icon: Mountain },
    ],
  },
  {
    title: "Science",
    items: [
      { to: "/polarimetry", label: "Polarimetry", icon: Activity },
      { to: "/likelihood", label: "Ice Likelihood", icon: Droplets },
    ],
  },
  {
    title: "Decisions",
    items: [
      { to: "/decision", label: "Decision Layer", icon: Target },
      { to: "/landing", label: "Landing Sites", icon: Award },
      { to: "/traverse", label: "Traverse Planner", icon: Route },
    ],
  },
  {
    title: "Resources",
    items: [
      { to: "/resources", label: "Resource Intelligence", icon: Boxes },
    ],
  },
  {
    title: "Validation",
    items: [
      { to: "/validation", label: "Validation Suite", icon: BarChart2 },
      { to: "/report", label: "Mission Report", icon: FileText },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/logs", label: "Activity Logs", icon: ScrollText },
      { to: "/dev", label: "Developer Mode", icon: Code2 },
      { to: "/diagnostics", label: "Diagnostics", icon: HeartPulse },
    ],
  },
];

export function Sidebar() {
  return (
    <nav className="w-[240px] shrink-0 bg-bg-secondary border-r border-border-subtle overflow-y-auto py-3">
      {GROUPS.map((g) => (
        <div key={g.title} className="mb-4">
          <div className="label px-4 mb-1 text-[10px] text-text-muted">{g.title}</div>
          {g.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2.5 px-4 py-1.5 text-md transition-colors duration-150",
                  isActive
                    ? "bg-accent-dim text-text-primary border-l-2 border-accent"
                    : "text-text-secondary hover:bg-bg-hover hover:text-text-primary border-l-2 border-transparent",
                ].join(" ")
              }
            >
              <it.icon size={16} className="shrink-0" />
              <span className="truncate">{it.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
