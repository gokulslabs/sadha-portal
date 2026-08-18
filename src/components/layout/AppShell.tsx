import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, HelpCircle, ChevronRight, User, LogOut } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return {
        email: user.email ?? "",
        name: profile?.display_name ?? user.email?.split("@")[0] ?? "Account",
      };
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-foreground/15 transition-colors hover:bg-sidebar-foreground/25"
      >
        <User className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel className="leading-tight">
          <span className="block truncate">{data?.name ?? "Account"}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {data?.email ?? ""}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Real pathname for a child slug (used for active-state matching). */
function pathForSlug(slug: string): string {
  if (slug === "dashboard") return "/";
  if (slug === "all-reports") return "/all-reports";
  if (slug === "tyre") return "/tyre";
  if (slug === "tyre-report") return "/tyre-report";
  if (slug === "tyre-module") return "/tyre-module";
  return `/p/${slug}`;
}

function linkForSlug(slug: string): { to: string; params: Record<string, string> } {
  const path = pathForSlug(slug);
  if (path.startsWith("/p/")) return { to: "/p/$", params: { _splat: slug } };
  return { to: path, params: {} };
}

const RAIL_WIDTH = 72;

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  // The open flyout menu, with its label and its vertical anchor (viewport top of the item).
  const [menu, setMenu] = useState<{ label: string; top: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeCategory = NAV.find((item) => {
    if (item.to && location.pathname === item.to) return true;
    if (item.label === "Dashboard" && location.pathname === "/") return true;
    return item.children?.some((c) => location.pathname === pathForSlug(c.slug));
  });

  const activeLabel = activeCategory?.label ?? "Dashboard";
  const openItem = NAV.find((item) => item.label === menu?.label);

  // Close the flyout when the path changes (navigated somewhere).
  useEffect(() => {
    setMenu(null);
  }, [location.pathname]);

  // Close the flyout on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function jumpTo(href: string) {
    void navigate({ to: href });
  }

  function handleItemClick(item: (typeof NAV)[number], event: React.MouseEvent<HTMLButtonElement>) {
    if (item.to) {
      setMenu(null);
      jumpTo(item.to);
      return;
    }
    if (item.children?.length) {
      const rect = event.currentTarget.getBoundingClientRect();
      // Clamp so the popup never overflows the bottom of the viewport.
      const menuHeight = Math.min(400, item.children.length * 44 + 56);
      const top = Math.max(8, Math.min(rect.top, window.innerHeight - menuHeight - 8));
      setMenu((prev) => (prev?.label === item.label ? null : { label: item.label, top }));
    }
  }

  return (
    <>
      {/* Main rail: narrow + permanent */}
      <div
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 z-40 flex w-[72px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
        style={{ width: RAIL_WIDTH }}
      >
        <Link
          to="/"
          className="flex h-14 items-center justify-center bg-brand text-lg font-bold tracking-wide text-brand-foreground shadow-md"
        >
          SG
        </Link>

        <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeLabel === item.label;
            const isOpen = menu?.label === item.label;

            return (
              <button
                key={item.label}
                onClick={(e) => handleItemClick(item, e)}
                className={cn(
                  "relative flex w-full flex-col items-center py-3.5 transition-all duration-200",
                  isActive || isOpen
                    ? "bg-sidebar-accent/80 text-brand"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {(isActive || isOpen) && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand shadow-[0_0_8px_rgba(var(--brand),0.5)]" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform hover:scale-110",
                    isActive || isOpen ? "text-brand" : "text-sidebar-foreground/70",
                  )}
                  strokeWidth={isActive || isOpen ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "mt-1.5 px-1 text-center text-[9px] font-semibold uppercase leading-tight tracking-tighter opacity-80",
                    isActive || isOpen ? "text-brand opacity-100" : "text-sidebar-foreground/60",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-5 border-t border-sidebar-border py-6">
          <HelpCircle className="h-5 w-5 cursor-pointer text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground" />
          <Bell className="h-5 w-5 cursor-pointer text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground" />
          <UserMenu />
        </div>
      </div>

      {/* Floating submenu — an overlay that never affects layout */}
      {openItem && openItem.children && menu && (
        <div
          className="fixed z-50 w-60 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-2xl"
          style={{ left: RAIL_WIDTH, top: menu.top }}
        >
          <div className="flex h-11 items-center border-b border-sidebar-border bg-sidebar-accent/20 px-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand/80">
              {openItem.label}
            </h2>
          </div>
          <nav className="max-h-[360px] space-y-1 overflow-y-auto p-2 no-scrollbar">
            {openItem.children.map((child) => {
              const link = linkForSlug(child.slug);
              const isActive = location.pathname === pathForSlug(child.slug);
              return (
                <Link
                  key={child.slug}
                  to={link.to}
                  params={link.params}
                  onClick={() => setMenu(null)}
                  className={cn(
                    "group flex items-center justify-between rounded-md border border-transparent px-3 py-2 text-[13.5px] transition-colors",
                    isActive
                      ? "border-brand/10 bg-brand font-bold text-brand-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span className="truncate tracking-tight">{child.label}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 opacity-0 transition-opacity",
                      isActive ? "opacity-100" : "group-hover:opacity-40",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Content margin = only the narrow rail width; the flyout overlays on top */}
      <main className="min-h-screen p-4 md:p-6 lg:p-8" style={{ marginLeft: RAIL_WIDTH }}>
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}