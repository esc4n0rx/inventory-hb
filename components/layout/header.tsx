"use client"

import { Package } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

export function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b"
    >
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span>Sistema de Ativos</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  )
}