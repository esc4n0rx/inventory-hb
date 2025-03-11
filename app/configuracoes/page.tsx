"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Database, Save } from "lucide-react"

const allowedTables = [
  "ativo_contagemlojas",
  "ativo_dadostransito",
  "ativo_inventario_hb",
  "ativo_dadoscadastral",
]

export default function Settings() {
  const [selectedTab, setSelectedTab] = useState("geral")
  const [selectedTable, setSelectedTable] = useState<string>(allowedTables[0])
  const [tableData, setTableData] = useState<any[]>([])
  const [loadingTable, setLoadingTable] = useState<boolean>(false)
  const [saveMessage, setSaveMessage] = useState<string>("")
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [showSystemKeyModal, setShowSystemKeyModal] = useState<boolean>(false)
  const [systemKey, setSystemKey] = useState<string>("")

  // Busca os dados da tabela selecionada via API
  const fetchTableData = async (table: string) => {
    setLoadingTable(true)
    try {
      const res = await fetch(`/api/configuracao?table=${table}`)
      const json = await res.json()
      setTableData(json.data || [])
      if (json.data && json.data.length > 0) {
        const cols = Object.keys(json.data[0])
        const initialVisibility: Record<string, boolean> = {}
        cols.forEach((col) => {
          initialVisibility[col] = true
        })
        setVisibleColumns(initialVisibility)
      }
    } catch (error) {
      console.error("Erro ao buscar dados da tabela:", error)
    } finally {
      setLoadingTable(false)
    }
  }

  useEffect(() => {
    if (selectedTab === "alterar") {
      fetchTableData(selectedTable)
    }
  }, [selectedTab, selectedTable])

  const handleCellChange = (rowIndex: number, field: string, value: any) => {
    const updated = [...tableData]
    updated[rowIndex] = { ...updated[rowIndex], [field]: value }
    setTableData(updated)
  }

  // Função que envia as alterações via PATCH para a API
  const handleSave = async (providedSystemKey: string) => {
    let successCount = 0
    let errorCount = 0
    for (const row of tableData) {
      const match = { id: row.id }
      try {
        const res = await fetch("/api/configuracao", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_key: providedSystemKey,
            table: selectedTable,
            match,
            data: row,
          }),
        })
        const result = await res.json()
        if (result.error) {
          errorCount++
        } else {
          successCount++
        }
      } catch (err) {
        errorCount++
      }
    }
    setSaveMessage(`Salvo com sucesso em ${successCount} registros. Erros: ${errorCount}`)
    fetchTableData(selectedTable)
  }

  // Modal para solicitar a System Key
  const SystemKeyModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: (key: string) => void }) => {
    const [localKey, setLocalKey] = useState("")
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
          <h2 className="text-xl font-bold mb-4">Digite a System Key</h2>
          <Input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="System Key"
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { onConfirm(localKey); onClose(); }}>Confirmar</Button>
          </div>
        </div>
      </div>
    )
  }

  // Componente para controlar a visibilidade das colunas
  const ColumnToggler = () => {
    const columns = Object.keys(visibleColumns)
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {columns.map((col) => (
          <label key={col} className="flex items-center space-x-1 text-xs">
            <input
              type="checkbox"
              checked={visibleColumns[col]}
              onChange={() => setVisibleColumns({ ...visibleColumns, [col]: !visibleColumns[col] })}
              className="form-checkbox"
            />
            <span>{col}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="w-64 border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
          </motion.div>
          <Tabs defaultValue="geral" className="space-y-4">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
              <TabsTrigger value="alterar">Alterar Dados</TabsTrigger>
              <TabsTrigger value="importacao">Importação</TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo Offline</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir operação sem conexão com internet
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup Automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Realizar backup diário dos dados
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo de Sincronização</Label>
                    <select className="w-full p-2 border rounded">
                      <option value="5">5 minutos</option>
                      <option value="15">15 minutos</option>
                      <option value="30">30 minutos</option>
                      <option value="60">1 hora</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notificacoes">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Notificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber alertas por email
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações no navegador
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Email para Notificações</Label>
                    <Input type="email" placeholder="seu@email.com" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alterar">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Dados da Tabela</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecione a Tabela</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedTable}
                      onChange={(e) => {
                        const newTable = e.target.value
                        setSelectedTable(newTable)
                        fetchTableData(newTable)
                      }}
                    >
                      {allowedTables.map((table) => (
                        <option key={table} value={table}>
                          {table}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ColumnToggler />
                  <div className="overflow-auto max-h-96 border rounded p-2">
                    {loadingTable ? (
                      <p>Carregando dados...</p>
                    ) : tableData.length === 0 ? (
                      <p>Nenhum registro encontrado.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            {Object.keys(tableData[0])
                              .filter((col) => visibleColumns[col])
                              .map((col) => (
                                <th key={col} className="border px-2 py-1">{col}</th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.entries(row)
                                .filter(([key]) => visibleColumns[key])
                                .map(([key, value]) => (
                                  <td key={key} className="border px-2 py-1">
                                    <Input
                                      value={value as string | number | readonly string[] | undefined}
                                      onChange={(e) =>
                                        handleCellChange(rowIndex, key, e.target.value)
                                      }
                                      className="w-full p-1"
                                    />
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setShowSystemKeyModal(true)} className="flex items-center gap-2">
                      <Save className="h-4 w-4" /> Salvar Alterações
                    </Button>
                  </div>
                  {saveMessage && (
                    <p className="text-sm mt-2 text-emerald-500">{saveMessage}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="importacao">
              <Card>
                <CardHeader>
                  <CardTitle>Importação de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="mt-2 font-medium">Arraste arquivos ou clique para upload</p>
                    <p className="text-sm text-muted-foreground">
                      Suporta arquivos CSV, XLS, XLSX
                    </p>
                    <Button variant="outline" className="mt-4">
                      Selecionar Arquivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Modal para System Key */}
      {showSystemKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowSystemKeyModal(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Digite a System Key</h2>
            <Input
              type="password"
              value={systemKey}
              onChange={(e) => setSystemKey(e.target.value)}
              placeholder="System Key"
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSystemKeyModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => { handleSave(systemKey); setShowSystemKeyModal(false); }}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
