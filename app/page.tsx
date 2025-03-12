"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Package,
  AlertTriangle,
  ClipboardCheck,
  PackageSearch,
  ArrowUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface StatusInventario {
  name: string
  value: number
  color: string
}

interface DashboardData {
  totalAtivos: number
  itensFaltantes: number
  itensConferidos: number
  emInventario: number
  statusInventario: StatusInventario[]
  distribuicaoAtivos: {
    inventarioAtual: { caixa_hb_623: number; caixa_hb_618: number }
    inventarioAnterior: { caixa_hb_623: number; caixa_hb_618: number }
  }
}

interface AcompanhamentoResponse {
  totalLojas: number
  totalContadas: number
  percentual: number
  pendentes: { [regional: string]: string[] }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false)
  const [statusData, setStatusData] = useState<AcompanhamentoResponse | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/calc_dash")
        const data: DashboardData = await res.json()
        setDashboardData(data)
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const pieData = dashboardData?.statusInventario || [
    { name: "Conferidos", value: 0, color: "hsl(var(--chart-1))" },
    { name: "Em Contagem", value: 0, color: "hsl(var(--chart-2))" },
    { name: "Pendentes", value: 0, color: "hsl(var(--chart-3))" },
  ]

  // Construção dos dados comparativos para o gráfico de barras (4 barras)
  let comparativoData: { name: string; value: number }[] = []
  if (dashboardData && dashboardData.distribuicaoAtivos) {
    const invAtual = dashboardData.distribuicaoAtivos.inventarioAtual
    const invAnterior = dashboardData.distribuicaoAtivos.inventarioAnterior
    if (
      invAtual.caixa_hb_623 === 0 &&
      invAtual.caixa_hb_618 === 0 &&
      invAnterior.caixa_hb_623 === 0 &&
      invAnterior.caixa_hb_618 === 0
    ) {
      comparativoData = []
    } else {
      comparativoData = [
        { name: "CAIXA HB 623 - Atual", value: invAtual.caixa_hb_623 },
        { name: "CAIXA HB 623 - Anterior", value: invAnterior.caixa_hb_623 },
        { name: "CAIXA HB 618 - Atual", value: invAtual.caixa_hb_618 },
        { name: "CAIXA HB 618 - Anterior", value: invAnterior.caixa_hb_618 },
      ]
    }
  }

  const handleStatusModal = async () => {
    try {
      const res = await fetch("/api/acompanhamento")
      const data: AcompanhamentoResponse = await res.json()
      setStatusData(data)
      setShowStatusModal(true)
    } catch (error) {
      console.error("Erro ao buscar dados de acompanhamento:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <Button size="lg" onClick={handleStatusModal}>
                Status Atual
              </Button>
            </div>
          </div>

          {loading ? (
            <div>Carregando dados...</div>
          ) : (
            <>
              {/* Linha de cards superiores */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
              >
                <motion.div variants={item}>
                  <Card>
                    <CardHeader className="flex justify-between items-center pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Lojas Finalizadas
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.totalAtivos}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card>
                    <CardHeader className="flex justify-between items-center pb-2">
                      <CardTitle className="text-sm font-medium">
                        Lojas Faltantes
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.itensFaltantes}
                      </div>
                      <div className="flex items-center text-xs text-destructive mt-1">
                        <ArrowUp className="h-4 w-4 mr-1" />
                        <span>Necessita atenção imediata</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card>
                    <CardHeader className="flex justify-between items-center pb-2">
                      <CardTitle className="text-sm font-medium">
                        Setores Finalizados
                      </CardTitle>
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.itensConferidos}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={item}>
                  <Card>
                    <CardHeader className="flex justify-between items-center pb-2">
                      <CardTitle className="text-sm font-medium">
                        Setores Pendentes
                      </CardTitle>
                      <PackageSearch className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.emInventario}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Linha de comparativo e status (lado a lado) */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 mb-8"
              >
                <motion.div variants={item}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparativo de Inventário</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comparativoData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-center text-sm text-muted-foreground">
                          Não há dados ainda
                        </div>
                      ) : (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparativoData} margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--background))",
                                  border: "1px solid hsl(var(--border))",
                                }}
                              />
                              <Legend />
                              <Bar
                                name="Comparativo"
                                dataKey="value"
                                fill="hsl(var(--chart-1))"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={item}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Status do Inventário</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </>
          )}
        </main>
      </div>

      {/* Modal de Status Atual */}
      {showStatusModal && statusData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowStatusModal(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-4">Status Atual do Inventário</h2>
            <div className="mb-4">
              <p className="text-sm">
                {statusData.totalContadas} de {statusData.totalLojas} lojas contadas
              </p>
              <p className="text-lg font-bold">
                {statusData.percentual}% do inventário realizado
              </p>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2">Lojas Pendentes por Regional</h3>
              {Object.entries(statusData.pendentes).map(([regional, lojas]) => (
                <div key={regional} className="mb-2">
                  <p className="text-sm font-medium">{regional}:</p>
                  <ul className="list-disc list-inside text-xs">
                    {lojas.map((loja, idx) => (
                      <li key={idx}>{loja}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
