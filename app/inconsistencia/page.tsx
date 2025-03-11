"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InconsistenciaPage() {
  const [setor, setSetor] = useState("")
  const [ativo, setAtivo] = useState("HB 623")
  const [quantidade, setQuantidade] = useState(0)
  const [obs, setObs] = useState("")
  const [foto, setFoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!setor || !ativo || quantidade <= 0 || !foto) {
      setError("Por favor, preencha todos os campos obrigatórios.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/inconsistencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ setor, ativo, quantidade, foto, obs })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess("Registro de inconsistência criado com sucesso!")
        // Limpar formulário
        setSetor("")
        setAtivo("HB 623")
        setQuantidade(0)
        setObs("")
        setFoto(null)
      }
    } catch (err: any) {
      setError("Erro ao enviar dados: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Header />
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Registro de Inconsistência</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive mb-2">{error}</p>}
            {success && <p className="text-emerald-500 mb-2">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Setor</label>
                <Input
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Digite o setor"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Ativo</label>
                <select
                  value={ativo}
                  onChange={(e) => setAtivo(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="HB 623">HB 623</option>
                  <option value="HB 618">HB 618</option>
                  <option value="HNT G">HNT G</option>
                  <option value="HNT P">HNT P</option>
                  <option value="BASCULHANTE">BASCULHANTE</option>
                  <option value="BIN">BIN</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Quantidade</label>
                <Input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  placeholder="Digite a quantidade"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Foto</label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Observação</label>
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Digite uma observação (opcional)"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Enviando..." : "Registrar Inconsistência"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
