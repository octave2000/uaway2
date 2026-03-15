import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-background/80 backdrop-blur-md">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-20 md:pb-0 z-10 relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-16 bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        <BottomNav />
      </div>
    </div>
  )
}
