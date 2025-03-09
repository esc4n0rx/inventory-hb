"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"

export default function Count() {
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
              <h1 className="text-3xl font-bold">Contagem Manual</h1>
              <p className="text-muted-foreground mt-1">
                Registre a contagem manual dos ativos
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Contagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="asset">Tipo de Ativo</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de ativo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hb623">CAIXA HB 623</SelectItem>
                          <SelectItem value="hb618">CAIXA HB 618</SelectItem>
                          <SelectItem value="hntg">CAIXA HNT G</SelectItem>
                          <SelectItem value="hntp">CAIXA HNT P</SelectItem>
                          <SelectItem value="basculante">CAIXA BASCULHANTE</SelectItem>
                          <SelectItem value="bin">CAIXA BIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="Digite a quantidade contada"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Adicione observações sobre a contagem"
                      />
                    </div>

                    <Button className="w-full">Registrar Contagem</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atalhos do Teclado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Salvar contagem</span>
                      <kbd className="px-2 py-1 bg-muted rounded">Ctrl + Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Próximo campo</span>
                      <kbd className="px-2 py-1 bg-muted rounded">Tab</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Campo anterior</span>
                      <kbd className="px-2 py-1 bg-muted rounded">Shift + Tab</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Limpar formulário</span>
                      <kbd className="px-2 py-1 bg-muted rounded">Ctrl + L</kbd>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}