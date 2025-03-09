"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Search, Filter, CheckCircle2, AlertCircle } from "lucide-react"

const inventoryData = [
  {
    id: 1,
    tipo: "CAIXA HB 623",
    quantidade: 150,
    esperado: 155,
    status: "divergente",
    ultimaContagem: "2024-03-15",
  },
  {
    id: 2,
    tipo: "CAIXA HB 618",
    quantidade: 120,
    esperado: 120,
    status: "conferido",
    ultimaContagem: "2024-03-15",
  },
  {
    id: 3,
    tipo: "CAIXA HNT G",
    quantidade: 90,
    esperado: 85,
    status: "divergente",
    ultimaContagem: "2024-03-14",
  },
  {
    id: 4,
    tipo: "CAIXA HNT P",
    quantidade: 80,
    esperado: 80,
    status: "conferido",
    ultimaContagem: "2024-03-14",
  },
  {
    id: 5,
    tipo: "CAIXA BASCULHANTE",
    quantidade: 60,
    esperado: 65,
    status: "divergente",
    ultimaContagem: "2024-03-13",
  },
  {
    id: 6,
    tipo: "CAIXA BIN",
    quantidade: 40,
    esperado: 40,
    status: "conferido",
    ultimaContagem: "2024-03-13",
  },
]

export default function Inventory() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Inventário Atual</h1>
              <Button>
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>

            <Card className="mb-8">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por tipo de ativo..."
                    className="pl-10"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Contagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tipo}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{item.esperado}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.status === "conferido" ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                              <span className="text-emerald-500">Conferido</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Divergente</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.ultimaContagem).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Contar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  )
}