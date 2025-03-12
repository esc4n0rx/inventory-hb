"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, Filter } from "lucide-react"

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
  dadosFornecedores: { [key: string]: number }
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
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false)
  const [showFinalModal, setShowFinalModal] = useState<boolean>(false)
  const [finalData, setFinalData] = useState<any>(null)
  const [loadingFinal, setLoadingFinal] = useState<boolean>(false)
  const [selectedMode, setSelectedMode] = useState<string>("inventariohb")

  // Labels dinâmicos
  const ativo1Label = selectedMode === "inventariohb" ? "CAIXA HB 623" : "CAIXA HNT G"
  const ativo2Label = selectedMode === "inventariohb" ? "CAIXA HB 618" : "CAIXA HNT P"

  // Busca os dados gerais do inventário
  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch("/api/inventario")
        const data: ApiInventoryResponse = await res.json()

        // Lista de ativos fixos para exibição (o rótulo da tabela não muda, pois é o resumo geral)
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
            status = totalDiff < 0 ? "Falta" : totalDiff > 0 ? "Sobra" : ""
          }

          return {
            tipo,
            contagemLojas,
            contagemCD,
            transitoSP,
            transitoES,
            fornecedores: data.dadosFornecedores[tipo] || 0,
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

  const filteredData = inventoryData.filter((row) =>
    row.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Função para finalizar o inventário: envia o modo selecionado para a API
  const handleFinalize = async () => {
    setLoadingFinal(true)
    try {
      const res = await fetch("/api/finalizar_inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      })
      const data = await res.json()
      setFinalData(data)
    } catch (error) {
      console.error("Erro ao finalizar inventário:", error)
    } finally {
      setLoadingFinal(false)
      setShowFinalModal(true)
    }
  }

  // Função para copiar o conteúdo formatado do resultado para a área de transferência
  const handleCopyToEmail = () => {
    if (finalData) {
      const { result, detalhes } = finalData
      let text = `Resultado Final do Inventário\n\n`
      text += `Inventário: ${result.cod_inventario}\n`
      text += `Modo: ${result.mode}\n`
      text += `Data: ${result.created_at}\n\n`
      text += `Totais:\n`
      if (selectedMode === "inventariohb") {
        text += `${ativo1Label}: ${result.caixa_hb_623}\n`
        text += `${ativo2Label}: ${result.caixa_hb_618}\n\n`
      } else {
        text += `${ativo1Label}: ${result.caixa_hnt_g}\n`
        text += `${ativo2Label}: ${result.caixa_hnt_p}\n\n`
      }
      text += `--- Detalhamento por Regional ---\n`
      for (const reg of ["resultado_CD_ES", "resultado_CD_SP", "resultado_CD_RJ"]) {
        const d = detalhes[reg]
        text += `${reg.replace("resultado_", "")}\n`
        text += `Contagem: ${ativo1Label}: ${d.contagem?.value1 || 0} / ${ativo2Label}: ${d.contagem?.value2 || 0}\n`
        text += `Transito: ${ativo1Label}: ${d.transito?.value1 || 0} / ${ativo2Label}: ${d.transito?.value2 || 0}\n`
        text += `Fornecedor: ${ativo1Label}: ${d.fornecedor?.value1 || 0} / ${ativo2Label}: ${d.fornecedor?.value2 || 0}\n`
        text += `Total: ${ativo1Label}: ${d.total?.value1 || 0} / ${ativo2Label}: ${d.total?.value2 || 0}\n\n`
      }
      text += `--- Lojas ---\n`
      for (const loja in detalhes.resultado_lojas) {
        const valores = detalhes.resultado_lojas[loja]
        text += `${loja}: ${ativo1Label}: ${valores.value1} / ${ativo2Label}: ${valores.value2}\n`
      }
      navigator.clipboard.writeText(text)
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
            {/* Cabeçalho e botões */}
            <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
              <h1 className="text-3xl font-bold">Inventário Atual</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Button>
                  <Filter className="mr-2 h-4 w-4" /> Filtros
                </Button>
                <Button onClick={() => setShowSupplierModal(true)}>
                  Inserir Fornecedores
                </Button>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="inventariohb">Inventário HB</option>
                    <option value="inventariohnt">Inventário HNT</option>
                  </select>
                  <Button onClick={handleFinalize}>Gerar Finalização</Button>
                </div>
              </div>
            </div>

            {/* Busca */}
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

            {/* Tabela de Inventário */}
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
                          {item.diferenca === "Não há dados" ? "Não há dados" : item.diferenca}
                        </TableCell>
                        <TableCell>
                          {item.diferenca === "Não há dados" ? "" : item.status ? <span>{item.status}</span> : ""}
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

      {/* Modal de Finalização */}
      {showFinalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
              <h2 className="text-2xl font-bold">Resultado Final do Inventário</h2>
              <Button variant="outline" onClick={() => setShowFinalModal(false)}>
                Fechar
              </Button>
            </div>
            {loadingFinal ? (
              <p>Carregando resultado...</p>
            ) : finalData && finalData.detalhes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card para cada regional */}
                <RegionalCard title="CD ES" data={finalData.detalhes.resultado_CD_ES} label1={ativo1Label} label2={ativo2Label} />
                <RegionalCard title="CD SP" data={finalData.detalhes.resultado_CD_SP} label1={ativo1Label} label2={ativo2Label} />
                <RegionalCard title="CD RJ" data={finalData.detalhes.resultado_CD_RJ} label1={ativo1Label} label2={ativo2Label} />
                {/* Card para Lojas */}
                <LojasCard data={finalData.detalhes.resultado_lojas} label1={ativo1Label} label2={ativo2Label} />
              </div>
            ) : (
              <p>Nenhum resultado disponível.</p>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCopyToEmail}>Copiar para email</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fornecedores */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowSupplierModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-4">Registro de Fornecedores</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Fornecedor</label>
                <select className="w-full p-2 border rounded">
                  <option value="FORNECEDORES ES">FORNECEDORES ES</option>
                  <option value="FORNECEDORES SP">FORNECEDORES SP</option>
                  <option value="FORNECEDORES RJ">FORNECEDORES RJ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Ativo</label>
                <select className="w-full p-2 border rounded">
                  <option value="CAIXA HB 623">CAIXA HB 623</option>
                  <option value="CAIXA HB 618">CAIXA HB 618</option>
                  <option value="CAIXA HNT G">CAIXA HNT G</option>
                  <option value="CAIXA HNT P">CAIXA HNT P</option>
                  <option value="CAIXA BASCULHANTE">CAIXA BASCULHANTE</option>
                  <option value="CAIXA BIN">CAIXA BIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Quantidade</label>
                <Input type="number" placeholder="Digite a quantidade" />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowSupplierModal(false)}>
                  Cancelar
                </Button>
                <Button className="ml-2">Registrar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para exibir card regional com rótulos dinâmicos
function RegionalCard({ title, data, label1, label2 }: { 
  title: string, 
  data: { contagem: { value1: number, value2: number }, transito: { value1: number, value2: number }, fornecedor: { value1: number, value2: number }, total: { value1: number, value2: number } }, 
  label1: string, 
  label2: string 
}) {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div><strong>Contagem:</strong> {label1}: {data.contagem.value1} / {label2}: {data.contagem.value2}</div>
        <div><strong>Transito:</strong> {label1}: {data.transito.value1} / {label2}: {data.transito.value2}</div>
        <div><strong>Fornecedor:</strong> {label1}: {data.fornecedor.value1} / {label2}: {data.fornecedor.value2}</div>
        <div><strong>Total:</strong> {label1}: {data.total.value1} / {label2}: {data.total.value2}</div>
      </CardContent>
    </Card>
  )
}

// Componente para exibir o card de lojas com rolagem e rótulos dinâmicos
function LojasCard({ data, label1, label2 }: { 
  data: { [loja: string]: { value1: number, value2: number } }, 
  label1: string, 
  label2: string 
}) {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Lojas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto text-sm">
          {Object.entries(data).map(([loja, valores]) => (
            <div key={loja} className="flex justify-between border-b py-1">
              <span>{loja}</span>
              <span>{label1}: {valores.value1} / {label2}: {valores.value2}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
