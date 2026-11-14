import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sloth Planner",
    short_name: "Sloth",
    description: "Tasks, events, projects, goals and notes in one calm planner, with optional end-to-end encryption.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "any",
    background_color: "#F3F7F1",
    theme_color: "#2C5540",
    categories: ["productivity", "education", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Tasks", url: "/tasks", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Notes", url: "/notes", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Schedule", url: "/schedule", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
