import { redirect } from 'next/navigation'

export default async function TenantAdminPage({ 
  params 
}: { 
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  redirect(`/${tenant}/admin/dashboard`)
}
