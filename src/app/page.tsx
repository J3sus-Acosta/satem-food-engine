import { redirect } from 'next/navigation'

/**
 * Root page — Redirects to /login by default.
 */
export default function HomePage() {
  redirect('/login')
}
