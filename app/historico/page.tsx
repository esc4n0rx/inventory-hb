"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Calendar, Filter, FileDown, CheckCircle2, AlertCircle, History as HistoryIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const historicalData = [
  {
    id: 1,
    data: "2024-03-15",
    responsavel: "João Silva",
    totalAtivos: 540,
    divergencias: 3,
    status: "finalizado",
    duracao: "2h 30min",
  },
  {
    id: 2,
    data: "2024-02-15",
    responsavel: "Maria Santos",
    totalAtivos: 535,
    divergencias: 1,
    status: "finalizado",
    duracao: "2h 15min",
  },
  {
    id: 3,
    data: "2024-01-15",
    responsavel: "Pedro Costa",
    totalAtivos: 530,
    divergencias: 2,
    status: "finalizado",
    duracao: "2h 45min",
  },
  {
    id: 4,
    data: "2023-12-15",
    responsavel: "Ana Oliveira",
    totalAtivos: 525,
    divergencias: 0,
    status: "finalizado",
    duracao: "2h 10min",
  },
]

export default function History() {
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
              <div>
                <h1 className="text-3xl font-bold">Histórico de Inventários</h1>
                <p className="text-muted-foreground mt-1">
                  Registro completo dos inventários realizados
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        <SelectItem value="365d">Último ano</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Responsável</label>
                    <Input placeholder="Filtrar por responsável" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="finalizado">Finalizados</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="cancelado">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              {historicalData.map((inventory) => (
                <motion.div
                  key={inventory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          Inventário de {new Date(inventory.data).toLocaleDateString("pt-BR")}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Responsável: {inventory.responsavel}
                        </p>
                      </div>
                      <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm font-medium">Total de Ativos</p>
                          <p className="text-2xl font-bold">{inventory.totalAtivos}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Divergências</p>
                          <p className={`text-2xl font-bold ${
                            inventory.divergencias > 0 ? "text-destructive" : "text-emerald-500"
                          }`}>
                            {inventory.divergencias}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Duração</p>
                          <p className="text-2xl font-bold">{inventory.duracao}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <div className="flex items-center mt-1">
                            {inventory.status === "finalizado" ? (
                              <>
                                <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" />
                                <span className="text-emerald-500">Finalizado</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                                <span className="text-destructive">Pendente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-6 gap-2">
                        <Button variant="outline">Ver Detalhes</Button>
                        <Button variant="outline">
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar Relatório
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}