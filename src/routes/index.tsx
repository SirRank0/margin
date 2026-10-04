import { createFileRoute } from "@tanstack/react-router";
import { MarginBoard } from "@/components/margin-board";
import { marginMeta } from "@/data/margin-meta";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <MarginBoard meta={marginMeta} />;
}
