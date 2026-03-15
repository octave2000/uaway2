import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full z-50 border-t bg-background">
        <BottomNav />
      </div>
    </div>
  )
}
