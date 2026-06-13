import { AdminPortalLayout } from "@/components/admin/admin-portal-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminPortalLayout>{children}</AdminPortalLayout>
}
