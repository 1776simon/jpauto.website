import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, FileText, Package, Download, TrendingUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Submissions", href: "/dashboard/submissions" },
    { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
    { icon: TrendingUp, label: "Market Research", href: "/dashboard/market-research" },
    { icon: Download, label: "Export", href: "/dashboard/export" },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-background text-sidebar-foreground transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold">
                JP
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground hidden sm:block">
                JP Auto
              </h1>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onToggle}
              className="md:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => {
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          onToggle();
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div className="border-t border-sidebar-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sidebar-primary/20 rounded-full flex items-center justify-center text-sidebar-primary font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => logout()}
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
}
