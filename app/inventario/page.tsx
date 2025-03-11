"use client"

import { useEffect, useState } from "react"
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

interface InventoryRow {
  tipo: string
  contagemLojas: number
  contagemCD: number
  transitoSP: number
  transitoES: number
  fornecedores: number
  diferenca: number | string
  status: string
}

interface ApiInventoryResponse {
  dadosLojas: { [key: string]: number }
  dadosCD: { [key: string]: number }
  dadosTransito: { setor: string; ativos: { name: string; total: number }[] }[]
  diferenca: {
    lojas: { [key: string]: number }
    cd: { [key: string]: number }
    transito: { [setor: string]: { [key: string]: number } }
  }
}

export default function Inventory() {
  const [inventoryData, setInventoryData] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch("/api/inventario")
        const data: ApiInventoryResponse = await res.json()

        // Definindo os tipos de ativos que serão exibidos
        const assetTypes = [
          "CAIXA HB 623",
          "CAIXA HB 618",
          "CAIXA HNT G",
          "CAIXA HNT P",
          "CAIXA BASCULHANTE",
          "CAIXA BIN",
        ]

        const rows: InventoryRow[] = assetTypes.map((tipo) => {
          // Contagem dos ativos a partir dos dados atuais
          const contagemLojas = data.dadosLojas[tipo] || 0
          const contagemCD = data.dadosCD[tipo] || 0

          const transitoKey = tipo === "CAIXA BASCULHANTE" ? "CAIXA CHOCOLATE" : tipo

          const transitoSPGroup = data.dadosTransito.find(
            (group) => group.setor === "CD SP"
          )
          const transitoESGroup = data.dadosTransito.find(
            (group) => group.setor === "CD ES"
          )
          const transitoSP =
            transitoSPGroup?.ativos.find((asset) => asset.name === transitoKey)
              ?.total || 0
          const transitoES =
            transitoESGroup?.ativos.find((asset) => asset.name === transitoKey)
              ?.total || 0

          // Calculando a diferença para cada ativo
          const diffLojas = data.diferenca.lojas[tipo] || 0
          const diffCD = data.diferenca.cd[tipo] || 0
          const diffTransitoSP = data.diferenca.transito["CD SP"]?.[transitoKey] ?? 0
          const diffTransitoES = data.diferenca.transito["CD ES"]?.[transitoKey] ?? 0

          // Se qualquer diferença for 9999, totalDiff será "Não há dados"
          let totalDiff: number | string = 0
          if (
            diffLojas === 9999 ||
            diffCD === 9999 ||
            diffTransitoSP === 9999 ||
            diffTransitoES === 9999
          ) {
            totalDiff = "Não há dados"
          } else {
            totalDiff = diffLojas + diffCD + diffTransitoSP + diffTransitoES
          }

          // Definindo o status com base na diferença
          let status = ""
          if (totalDiff !== "Não há dados" && typeof totalDiff === "number") {
            if (totalDiff < 0) {
              status = "Falta"
            } else if (totalDiff > 0) {
              status = "Sobra"
            }
          }

          return {
            tipo,
            contagemLojas,
            contagemCD,
            transitoSP,
            transitoES,
            fornecedores: 0,
            diferenca: totalDiff,
            status,
          }
        })

        setInventoryData(rows)
      } catch (error) {
        console.error("Erro ao buscar dados de inventário:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [])

  // Filtra os dados conforme o termo de busca
  const filteredData = inventoryData.filter((row) =>
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {loading ? (
              <p>Carregando dados...</p>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Contagem Lojas</TableHead>
                      <TableHead className="text-right">Contagem CD</TableHead>
                      <TableHead className="text-right">Trânsito SP</TableHead>
                      <TableHead className="text-right">Trânsito ES</TableHead>
                      <TableHead className="text-right">Fornecedores</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.tipo}</TableCell>
                        <TableCell className="text-right">{item.contagemLojas}</TableCell>
                        <TableCell className="text-right">{item.contagemCD}</TableCell>
                        <TableCell className="text-right">{item.transitoSP}</TableCell>
                        <TableCell className="text-right">{item.transitoES}</TableCell>
                        <TableCell className="text-right">{item.fornecedores}</TableCell>
                        <TableCell className="text-right">
                          {item.diferenca === "Não há dados"
                            ? "Não há dados"
                            : item.diferenca}
                        </TableCell>
                        <TableCell>
                          {item.diferenca === "Não há dados" ? (
                            ""
                          ) : item.status ? (
                            <span>{item.status}</span>
                          ) : (
                            ""
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
