import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to dashboard - in a real app, this would check authentication
  redirect("/dashboard")
}
