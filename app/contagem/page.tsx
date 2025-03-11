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

// Importa as listas de lojas e setores (assumindo estrutura: { "lojas": [ ... ] } e { "setores": [ ... ] })
import lojasList from "@/lib/lojas.json"
import setoresList from "@/lib/setor.json"

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

  // Estados para o formulário de inserção
  const [selectedTable, setSelectedTable] = useState<string>("ativo_contagemlojas")
  const [selectedSetor, setSelectedSetor] = useState<string>("")
  const [selectedAtivo, setSelectedAtivo] = useState<string>("HB 623")
  const [insertionQuantidade, setInsertionQuantidade] = useState<number>(0)
  const [insertionError, setInsertionError] = useState<string>("")
  const [insertionSuccess, setInsertionSuccess] = useState<string>("")

  // Retorna as opções para o select de setor com base na tabela escolhida
  const getSetorOptions = () => {
    if (selectedTable === "ativo_contagemlojas") {
      return lojasList.lojas // lista de lojas
    } else if (selectedTable === "ativos_inventario_hb") {
      return setoresList.setores // lista de setores
    } else if (selectedTable === "ativo_dadostransito") {
      return ["CD SP", "CD ES"] // opções fixas
    }
    return []
  }

  // Quando a tabela escolhida muda, atualiza automaticamente o setor selecionado
  useEffect(() => {
    const options = getSetorOptions()
    setSelectedSetor(options[0] || "")
  }, [selectedTable])

  async function fetchInventory() {
    try {
      const res = await fetch("/api/inventario")
      const data: ApiInventoryResponse = await res.json()

      const assetTypes = [
        "CAIXA HB 623",
        "CAIXA HB 618",
        "CAIXA HNT G",
        "CAIXA HNT P",
        "CAIXA BASCULHANTE",
        "CAIXA BIN",
      ]

      const rows: InventoryRow[] = assetTypes.map((tipo) => {
        const contagemLojas = data.dadosLojas[tipo] || 0
        const contagemCD = data.dadosCD[tipo] || 0

        // Para trânsito, se o ativo for BASCULHANTE usamos o valor de "CAIXA CHOCOLATE"
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

        const diffLojas = data.diferenca.lojas[tipo] || 0
        const diffCD = data.diferenca.cd[tipo] || 0
        const diffTransitoSP = data.diferenca.transito["CD SP"]?.[transitoKey] ?? 0
        const diffTransitoES = data.diferenca.transito["CD ES"]?.[transitoKey] ?? 0

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

  useEffect(() => {
    fetchInventory()
  }, [])

  const filteredData = inventoryData.filter((row) =>
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleInsertionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInsertionError("")
    setInsertionSuccess("")
    if (!selectedTable || !selectedAtivo || !selectedSetor || insertionQuantidade === 0) {
      setInsertionError("Todos os campos são obrigatórios e a quantidade deve ser maior que zero.")
      return
    }
    try {
      const res = await fetch("/api/insercao_ativos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabela: selectedTable,
          ativo: selectedAtivo,
          setor: selectedSetor,
          quantidade: insertionQuantidade,
        }),
      })
      const result = await res.json()
      if (result.error) {
        setInsertionError(result.error)
      } else {
        setInsertionSuccess("Inserido com sucesso!")
        // Limpa os campos do formulário
        setSelectedAtivo("HB 623")
        setInsertionQuantidade(0)
        // Recarrega os dados do inventário após a inserção
        fetchInventory()
      }
    } catch (error: any) {
      setInsertionError(error.message)
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Inventário Atual</h1>
              <Button>
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>

            {/* Formulário de inserção de ativos */}
            <Card className="mb-8 p-4">
              <h2 className="text-xl font-semibold mb-4">Inserir Ativo</h2>
              {insertionError && (
                <div className="mb-4 text-destructive">{insertionError}</div>
              )}
              {insertionSuccess && (
                <div className="mb-4 text-emerald-500">{insertionSuccess}</div>
              )}
              <form
                onSubmit={handleInsertionSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleInsertionSubmit(e as any)
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select para tabela principal */}
                  <div>
                    <label className="block mb-1">Tabela Principal</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                    >
                      <option value="ativo_contagemlojas">Ativo Contagem Lojas</option>
                      <option value="ativos_inventario_hb">Ativos Inventário HB</option>
                      <option value="ativo_dadostransito">Ativo Dados Trânsito</option>
                    </select>
                  </div>
                  {/* Select para setor, que varia conforme a tabela escolhida */}
                  <div>
                    <label className="block mb-1">Setor</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedSetor}
                      onChange={(e) => setSelectedSetor(e.target.value)}
                    >
                      {getSetorOptions().map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Select para ativo */}
                  <div>
                    <label className="block mb-1">Ativo</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedAtivo}
                      onChange={(e) => setSelectedAtivo(e.target.value)}
                    >
                      <option value="HB 623">HB 623</option>
                      <option value="HB 618">HB 618</option>
                      <option value="HNT G">HNT G</option>
                      <option value="HNT P">HNT P</option>
                      <option value="BASCULHANTE">BASCULHANTE</option>
                      <option value="BIN">BIN</option>
                    </select>
                  </div>
                  {/* Input para quantidade */}
                  <div>
                    <label className="block mb-1">Quantidade</label>
                    <Input
                      type="number"
                      value={insertionQuantidade}
                      onChange={(e) =>
                        setInsertionQuantidade(Number(e.target.value))
                      }
                      placeholder="Digite a quantidade"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button type="submit">Inserir</Button>
                </div>
              </form>
            </Card>

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
