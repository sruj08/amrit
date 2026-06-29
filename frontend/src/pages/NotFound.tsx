import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { PageHeader, Card } from "../components/ui/Primitives";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Route not found" subtitle={pathname} />
      <Card>
        <div className="flex items-start gap-3">
          <Compass size={20} className="text-text-secondary mt-0.5" />
          <div>
            <div className="text-md font-semibold text-text-primary">No page at this route</div>
            <p className="text-sm text-text-secondary mt-1">
              Use the sidebar to navigate. Return to the{" "}
              <Link to="/" className="text-accent-hover underline">Mission Overview</Link>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
