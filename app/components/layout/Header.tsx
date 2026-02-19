import { Form, Link } from "react-router";
import { cn } from "~/lib/utils";
import type { User } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import {
  LogOut,
  Settings,
  User as UserIcon,
  Menu,
  Package,
} from "lucide-react";
import { SidebarContent } from "./Sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

interface HeaderProps {
  user: User;
}

const roleColors = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  USER: "bg-gray-100 text-gray-800",
};

export function Header({ user }: HeaderProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                <span>Asset Manager</span>
              </SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <SidebarContent user={user} />
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold truncate max-w-[150px] sm:max-w-none">
          Asset Management System
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Badge
          className={cn(
            "hidden sm:inline-flex",
            roleColors[user.role as keyof typeof roleColors],
          )}
          variant="secondary"
        >
          {user.role}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/my-assets" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                My Assets
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Form action="/logout" method="post">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </button>
              </DropdownMenuItem>
            </Form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
