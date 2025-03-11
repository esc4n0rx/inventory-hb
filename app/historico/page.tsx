"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { motion } from "framer-motion"
import {
  Calendar,
  Filter,
  FileDown,
  History as HistoryIcon,
  XCircle,
} from "lucide-react"

interface HistoricoItem {
  cod_inventario: number
  dataInicio: string
  dataFim: string
  contagemLojas: number
  contagemInventarioHB: number
  contagemTransito: number
}

interface DetalhesGrupo {
  detalhes: { [setor: string]: number }
  minDate: string
  maxDate: string
  total: number
}

interface DetalhesTransito {
  detalhes: { [setor: string]: { [tipo: string]: number } }
  minDate: string
  maxDate: string
  total: number
}

interface PorAtivoContagem {
  minDate: string
  maxDate: string
  detalhes: { [loja: string]: { [ativo: string]: number } }
}

interface PorAtivoInventario {
  minDate: string
  maxDate: string
  detalhes: { [setor: string]: { [ativo: string]: number } }
}

interface HistoricoResponse {
  historico: HistoricoItem[]
  detalhes: {
    ativo_contagemlojas: { [cod: string]: DetalhesGrupo }
    ativo_inventario_hb: { [cod: string]: DetalhesGrupo }
    ativo_dadostransito: { [cod: string]: DetalhesTransito }
  }
  por_ativo: {
    ativo_contagemlojas: { [cod: string]: PorAtivoContagem }
    ativo_inventario_hb: { [cod: string]: PorAtivoInventario }
  }
}

export default function History() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [detalhes, setDetalhes] = useState<HistoricoResponse["detalhes"] | null>(null)
  const [porAtivo, setPorAtivo] = useState<HistoricoResponse["por_ativo"] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [selectedCod, setSelectedCod] = useState<number | null>(null)
  const [exporting, setExporting] = useState<boolean>(false)
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<"Lojas" | "Inventário HB" | "Transito">("Lojas")
  const [visibleCount, setVisibleCount] = useState<number>(10)

  async function fetchHistorico() {
    setLoading(true)
    try {
      const res = await fetch("/api/historico")
      const data: HistoricoResponse = await res.json()
      setHistorico(data.historico)
      setDetalhes(data.detalhes)
      setPorAtivo(data.por_ativo)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorico()
  }, [])

  const filteredHistorico = historico.filter((item) => {
    if (startDate && item.dataInicio < startDate) return false
    if (endDate && item.dataFim > endDate) return false
    return true
  })

  const calcularTotalAtivos = (item: HistoricoItem) =>
    item.contagemLojas + item.contagemInventarioHB + item.contagemTransito

  async function handleExport(cod?: number) {
    setExporting(true)
    try {
      const res = await fetch("/api/historico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod_inventario: cod ?? null }),
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = cod ? `historico_${cod}.csv` : "historico.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
    } finally {
      setExporting(false)
    }
  }

  // Quando a aba muda, reinicia a contagem de itens visíveis
  useEffect(() => {
    setVisibleCount(10)
  }, [selectedDetailCategory])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Histórico de Inventários</h1>
                <p className="text-muted-foreground mt-1">
                  Registro completo dos inventários realizados
                </p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button onClick={() => handleExport()} disabled={exporting}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
                <Button>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </div>
            </div>

            {/* Filtros de período */}
            <Card className="mb-8">
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {loading ? (
              <p>Carregando dados...</p>
            ) : filteredHistorico.length === 0 ? (
              <p>Nenhum inventário encontrado para o período selecionado.</p>
            ) : (
              <div className="grid gap-6">
                {filteredHistorico.map((item) => (
                  <motion.div
                    key={item.cod_inventario}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            Inventário #{item.cod_inventario}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Período: {item.dataInicio} até {item.dataFim}
                          </p>
                        </div>
                        <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-sm font-medium">Total de Ativos</p>
                            <p className="text-2xl font-bold">
                              {calcularTotalAtivos(item)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Contagem Lojas</p>
                            <p className="text-2xl font-bold">{item.contagemLojas}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Contagem Inventário HB</p>
                            <p className="text-2xl font-bold">{item.contagemInventarioHB}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Contagem Trânsito</p>
                            <p className="text-2xl font-bold">{item.contagemTransito}</p>
                          </div>
                        </div>
                        <div className="flex justify-end mt-6 gap-2">
                          <Button variant="outline" onClick={() => setSelectedCod(item.cod_inventario)}>
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" onClick={() => handleExport(item.cod_inventario)} disabled={exporting}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar Relatório
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal de Detalhes */}
      {selectedCod !== null && detalhes && porAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setSelectedCod(null)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
              <h2 className="text-2xl font-bold">
                Detalhes do Inventário #{selectedCod}
              </h2>
              <Button variant="ghost" onClick={() => setSelectedCod(null)}>
                <XCircle className="h-6 w-6" />
              </Button>
            </div>
            {/* Tabs */}
            <div className="p-4 border-b">
              <div className="hidden md:flex space-x-4">
                {(["Lojas", "Inventário HB", "Transito"] as const).map((cat) => (
                  <button
                    key={cat}
                    className={`px-4 py-2 rounded ${
                      selectedDetailCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedDetailCategory(cat)
                      setVisibleCount(10)
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="md:hidden">
                <select
                  className="w-full p-2 border rounded"
                  value={selectedDetailCategory}
                  onChange={(e) => {
                    setSelectedDetailCategory(e.target.value as "Lojas" | "Inventário HB" | "Transito")
                    setVisibleCount(10)
                  }}
                >
                  <option value="Lojas">Lojas</option>
                  <option value="Inventário HB">Inventário HB</option>
                  <option value="Transito">Transito</option>
                </select>
              </div>
            </div>
            {/* Conteúdo com rolagem interna e carregamento incremental */}
            <div
              className="p-4 overflow-y-auto"
              style={{ maxHeight: "50vh" }}
              onScroll={(e) => {
                const target = e.target as HTMLElement
                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
                  setVisibleCount((prev) => prev + 10)
                }
              }}
            >
              {selectedDetailCategory === "Lojas" && porAtivo.ativo_contagemlojas[selectedCod.toString()] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porAtivo.ativo_contagemlojas[selectedCod.toString()].detalhes)
                    .slice(0, visibleCount)
                    .map(([loja, ativos]) => (
                      <Card key={loja} className="shadow-sm">
                        <CardHeader className="border-b">
                          <CardTitle className="text-sm font-semibold">{loja}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {Object.entries(ativos).map(([ativo, total]) => (
                            <div key={ativo} className="flex justify-between text-xs">
                              <span>{ativo}</span>
                              <span>{total}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : selectedDetailCategory === "Inventário HB" && porAtivo.ativo_inventario_hb[selectedCod.toString()] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(porAtivo.ativo_inventario_hb[selectedCod.toString()].detalhes)
                    .slice(0, visibleCount)
                    .map(([setor, ativos]) => (
                      <Card key={setor} className="shadow-sm">
                        <CardHeader className="border-b">
                          <CardTitle className="text-sm font-semibold">{setor}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {Object.entries(ativos).map(([ativo, total]) => (
                            <div key={ativo} className="flex justify-between text-xs">
                              <span>{ativo}</span>
                              <span>{total}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : selectedDetailCategory === "Transito" && detalhes.ativo_dadostransito[selectedCod.toString()] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(detalhes.ativo_dadostransito[selectedCod.toString()].detalhes)
                    .slice(0, visibleCount)
                    .map(([setor, ativos]) => (
                      <Card key={setor} className="shadow-sm">
                        <CardHeader className="border-b">
                          <CardTitle className="text-sm font-semibold">{setor}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          {Object.entries(ativos).map(([ativo, total]) => (
                            <div key={ativo} className="flex justify-between text-xs">
                              <span>{ativo}</span>
                              <span>{total}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              )}
            </div>
            <div className="flex justify-end p-4 border-t">
              <Button variant="outline" onClick={() => setSelectedCod(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
