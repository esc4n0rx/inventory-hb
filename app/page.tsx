"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Package,
  AlertTriangle,
  Plus,
  ClipboardCheck,
  PackageSearch,
  ArrowUp,
  ArrowDown,
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

const barData = [
  { name: "CAIXA HB 623", quantidade: 150, esperado: 155 },
  { name: "CAIXA HB 618", quantidade: 120, esperado: 120 },
  { name: "CAIXA HNT G", quantidade: 90, esperado: 85 },
  { name: "CAIXA HNT P", quantidade: 80, esperado: 80 },
  { name: "CAIXA BASCULHANTE", quantidade: 60, esperado: 65 },
  { name: "CAIXA BIN", quantidade: 40, esperado: 40 },
]

const pieData = [
  { name: "Conferidos", value: 487, color: "hsl(var(--chart-1))" },
  { name: "Em Contagem", value: 53, color: "hsl(var(--chart-2))" },
  { name: "Pendentes", value: 3, color: "hsl(var(--chart-3))" },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" /> Iniciar Novo Inventário
            </Button>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Ativos
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">540</div>
                  <div className="flex items-center text-xs text-emerald-500 mt-1">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>2.1% em relação ao mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Itens Faltantes
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <div className="flex items-center text-xs text-destructive mt-1">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>Necessita atenção imediata</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Itens Conferidos
                  </CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">487</div>
                  <div className="flex items-center text-xs text-emerald-500 mt-1">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span>90% do inventário atual</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Em Inventário
                  </CardTitle>
                  <PackageSearch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">53</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Contagem em andamento</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 mb-8"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))'
                          }}
                        />
                        <Legend />
                        <Bar 
                          name="Quantidade Atual" 
                          dataKey="quantidade" 
                          fill="hsl(var(--chart-1))"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          name="Quantidade Esperada" 
                          dataKey="esperado" 
                          fill="hsl(var(--chart-2))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Status do Inventário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
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
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))'
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
        </main>
      </div>
    </div>
  )
}