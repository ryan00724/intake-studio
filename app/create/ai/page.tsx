import { redirect } from "next/navigation";

/** Deep-link: redirects to the dashboard with the AI modal open. */
export default function AICreateRedirect() {
  redirect("/dashboard?ai=true");
}
