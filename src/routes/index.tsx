import { createFileRoute } from "@tanstack/react-router";
import Phone from "@/components/phone/Phone";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sungchan’s Phone — Fictional Seoul Stories" },
      { name: "description", content: "Explore a fictional Seoul campus story through editable Korean chats, Instagram posts, X, albums and notes on Sungchan’s phone." },
      { property: "og:title", content: "Sungchan’s Phone — Fictional Seoul Stories" },
      { property: "og:description", content: "A fictional fan-work phone with connected 2022–2026 chats, photos, posts and notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <main className="phone-stage">
      <Phone />
    </main>
  ),
});
