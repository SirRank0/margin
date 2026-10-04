import { createFileRoute } from "@tanstack/react-router";
import { MarginBoard } from "@/components/margin-board";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <MarginBoard />;
}
