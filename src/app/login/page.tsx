import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import LoginClient from './LoginClient'

export const metadata = {
  title: 'Acceso - SATEM Food Engine',
  description: 'SATEM Food Engine - Pantalla de Acceso al Sistema',
}

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage(props: PageProps) {
  // If user has a valid active session, redirect straight to dashboard
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }

  const params = await props.searchParams
  const callbackUrl = params.callbackUrl || '/dashboard'

  return <LoginClient callbackUrl={callbackUrl} />
}
