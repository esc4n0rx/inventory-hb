"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  ClipboardList,
  Calculator,
  AlertTriangle,
  Settings,
  History,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Inventário Atual",
    href: "/inventario",
    icon: ClipboardList,
  },
  {
    title: "Contagem Manual",
    href: "/contagem",
    icon: Calculator,
  },
  {
    title: "Divergências",
    href: "/divergencias",
    icon: AlertTriangle,
  },
  {
    title: "Histórico",
    href: "/historico",
    icon: History,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="pb-12 min-h-screen"
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
              >
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href && "bg-muted"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}