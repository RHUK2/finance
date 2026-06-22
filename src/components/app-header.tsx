"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { NAV_ITEMS } from "@/lib/nav";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type BreadcrumbEntry = { label: string; href?: string };

type Props = {
  breadcrumbs: BreadcrumbEntry[];
};

export function AppHeader({ breadcrumbs }: Props) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={item.label} className="flex items-center gap-1.5">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast && isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 font-medium outline-none">
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-44">
                        {NAV_ITEMS.filter((n) => n.href !== pathname).map(
                          ({ label, href, icon: Icon }) => (
                            <DropdownMenuItem
                              key={href}
                              onClick={() => router.push(href)}
                            >
                              <Icon className="h-4 w-4" />
                              {label}
                            </DropdownMenuItem>
                          ),
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href ?? "/"}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
