import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import type { User } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  ClipboardList,
  Laptop,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Clock,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useState } from "react";

interface SidebarProps {
  user: User;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: ("OWNER" | "ADMIN" | "USER")[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Assets",
    href: "/dashboard/assets",
    icon: <Package className="h-5 w-5" />,
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    label: "Companies",
    href: "/dashboard/companies",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["OWNER"],
  },
  {
    label: "Assignments",
    href: "/dashboard/assignments",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    label: "Requests",
    href: "/dashboard/requests",
    icon: <Clock className="h-5 w-5" />,
    roles: ["OWNER", "ADMIN"],
  },
  {
    label: "My Assets",
    href: "/dashboard/my-assets",
    icon: <Laptop className="h-5 w-5" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["OWNER", "ADMIN", "USER"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <UserIcon className="h-5 w-5" />,
  },
];

export function SidebarContent({
  user,
  collapsed = false,
  onNavItemClick,
}: {
  user: User;
  collapsed?: boolean;
  onNavItemClick?: () => void;
}) {
  const location = useLocation();
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role as any);
  });

  return (
    <nav className="space-y-1 px-2">
      {filteredNavItems.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href !== "/dashboard" &&
            location.pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavItemClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center",
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-semibold">Asset Manager</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <Package className="h-6 w-6 text-primary" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <SidebarContent user={user} collapsed={collapsed} />
      </ScrollArea>

      {/* Collapse button */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
