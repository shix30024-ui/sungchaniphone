import { createFileRoute } from "@tanstack/react-router";
import Phone from "@/components/phone/Phone";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Phone — Home Screen" },
      { name: "description", content: "An iPhone-style home screen with lock screen, editable apps and EN/KO/ZH languages." },
      { property: "og:title", content: "My Phone — Home Screen" },
      { property: "og:description", content: "iPhone-style lock & home screen with editable apps." },
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
