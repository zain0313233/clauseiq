import { PortalLayout } from "@/components/layout/portal-layout"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout fullBleed>{children}</PortalLayout>
}
