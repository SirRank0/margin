import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MarginBoard } from "@/components/margin-board";
import { marginMeta } from "@/data/margin-meta";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <MarginBoard meta={marginMeta} />
  </StrictMode>,
);
