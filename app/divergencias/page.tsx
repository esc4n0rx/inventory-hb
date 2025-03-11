"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { XCircle, FileDown, AlertTriangle } from "lucide-react"

interface Inconsistencia {
  id: number
  cod_inventario: number
  setor: string
  ativo: string
  quantidade: number
  foto: string
  obs?: string
  created_at: string
}

export default function Divergences() {
  const [divergences, setDivergences] = useState<Inconsistencia[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [visibleCount, setVisibleCount] = useState<number>(10)
  const [selectedTicket, setSelectedTicket] = useState<Inconsistencia | null>(null)
  const [copySuccess, setCopySuccess] = useState("")

  // Busca os registros de inconsistências da API
  async function fetchDivergences() {
    setLoading(true)
    try {
      const res = await fetch("/api/inconsistencia")
      const data = await res.json()
      setDivergences(data.inconsistencias || [])
    } catch (error) {
      console.error("Erro ao buscar inconsistências:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const link = window.location.origin + "/inconsistencia"
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopySuccess("Link copiado!")
        setTimeout(() => setCopySuccess(""), 3000)
      })
      .catch((err) => {
        console.error("Erro ao copiar link: ", err)
        setCopySuccess("Erro ao copiar o link.")
        setTimeout(() => setCopySuccess(""), 3000)
      })
  }

  useEffect(() => {
    fetchDivergences()
  }, [])

  // Incrementa a quantidade de itens exibidos conforme o usuário rola o container
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      setVisibleCount((prev) => prev + 10)
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

          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Divergências</h1>
              <p className="text-muted-foreground mt-1">
                Registros de inconsistências de falta de rotatividade
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/inconsistencia">
              <Button variant="outline" onClick={handleCopyLink}>
                  Gerar Link de Inconsistência
               </Button>
              {copySuccess && (
                <p className="mt-2 text-sm text-emerald-500">{copySuccess}</p>
              )}
              </Link>
            </div>
          </div>

          {loading ? (
            <p>Carregando divergências...</p>
          ) : divergences.length === 0 ? (
            <p>Nenhuma divergência registrada.</p>
          ) : (
            <div
              className="grid gap-6 max-h-[70vh] overflow-y-auto pr-2"
              onScroll={handleScroll}
            >
              {divergences.slice(0, visibleCount).map((div) => (
                <motion.div
                  key={div.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card
                    className="cursor-pointer"
                    onClick={() => setSelectedTicket(div)}
                  >
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{div.ativo}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Setor: {div.setor}
                        </p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium">Quantidade</p>
                          <p className="text-2xl font-bold">{div.quantidade}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Data</p>
                          <p className="text-sm">
                            {new Date(div.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes do Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setSelectedTicket(null)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
              <h2 className="text-2xl font-bold">
                Detalhes da Divergência #{selectedTicket.id}
              </h2>
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                <XCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Setor</p>
                  <p>{selectedTicket.setor}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ativo</p>
                  <p>{selectedTicket.ativo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quantidade</p>
                  <p>{selectedTicket.quantidade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Observação</p>
                  <p>{selectedTicket.obs || "Sem observação"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data do Registro</p>
                  <p>{new Date(selectedTicket.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Foto</p>
                  <img
                    src={selectedTicket.foto}
                    alt="Foto da divergência"
                    className="w-full object-cover rounded-lg border"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
