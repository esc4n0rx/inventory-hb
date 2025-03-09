"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react"

const divergences = [
  {
    id: 1,
    tipo: "CAIXA HB 623",
    esperado: 155,
    contado: 150,
    diferenca: -5,
    data: "2024-03-15",
    status: "pendente",
  },
  {
    id: 2,
    tipo: "CAIXA HNT G",
    esperado: 85,
    contado: 90,
    diferenca: 5,
    data: "2024-03-14",
    status: "pendente",
  },
  {
    id: 3,
    tipo: "CAIXA BASCULHANTE",
    esperado: 65,
    contado: 60,
    diferenca: -5,
    data: "2024-03-13",
    status: "pendente",
  },
]

export default function Divergences() {
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Divergências</h1>
              <p className="text-muted-foreground mt-1">
                Ativos com diferenças entre contagem e quantidade esperada
              </p>
            </div>

            <div className="grid gap-6">
              {divergences.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{item.tipo}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Detectado em {new Date(item.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium">Quantidade Esperada</p>
                          <p className="text-2xl font-bold">{item.esperado}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Quantidade Contada</p>
                          <p className="text-2xl font-bold">{item.contado}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Diferença</p>
                          <div className="flex items-center">
                            <p className={`text-2xl font-bold ${
                              item.diferenca > 0 ? "text-emerald-500" : "text-destructive"
                            }`}>
                              {item.diferenca > 0 ? "+" : ""}{item.diferenca}
                            </p>
                            {item.diferenca > 0 ? (
                              <ArrowUp className="ml-2 h-5 w-5 text-emerald-500" />
                            ) : (
                              <ArrowDown className="ml-2 h-5 w-5 text-destructive" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-6 gap-2">
                        <Button variant="outline">Recontar</Button>
                        <Button>Justificar Divergência</Button>
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