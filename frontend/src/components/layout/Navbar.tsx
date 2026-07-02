"use client";

import { Moon, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { useEffect } from "react";

export function Navbar() {
  const { theme, setTheme, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();

  // Apply dark class to <html> on theme change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
        <Menu size={20} />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            <span className="hidden sm:block text-sm font-medium">{user.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
