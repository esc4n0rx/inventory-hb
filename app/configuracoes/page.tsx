"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { 
  Upload,
  Bell,
  Smartphone,
  Database,
  Save,
  Wifi,
  Server,
  RefreshCw,
  Settings2,
  FileUp
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select"

export default function Settings() {
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
              <h1 className="text-3xl font-bold">Configurações</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie as configurações do sistema
              </p>
            </div>

            <Tabs defaultValue="geral" className="space-y-4">
              <TabsList>
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
                <TabsTrigger value="integrador">Integrador</TabsTrigger>
                <TabsTrigger value="importacao">Importação</TabsTrigger>
              </TabsList>

              <TabsContent value="geral">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalo de Sincronização</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div className="space-y-4">
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
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Alertas de Divergência</Label>
                          <p className="text-sm text-muted-foreground">
                            Notificar quando houver divergências
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email para Notificações</Label>
                      <Input type="email" placeholder="seu@email.com" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrador">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuração do Integrador</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <Wifi className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Status do Integrador</p>
                          <p className="text-sm text-muted-foreground">Aguardando conexão</p>
                        </div>
                        <Button className="ml-auto" variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reconectar
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Endereço IP do Coletor</Label>
                          <Input placeholder="192.168.1.100" />
                        </div>
                        <div className="space-y-2">
                          <Label>Porta de Comunicação</Label>
                          <Input placeholder="8080" />
                        </div>
                        <div className="space-y-2">
                          <Label>Chave de Autenticação</Label>
                          <Input type="password" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Sincronização Automática</Label>
                            <p className="text-sm text-muted-foreground">
                              Sincronizar dados automaticamente
                            </p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Modo Debug</Label>
                            <p className="text-sm text-muted-foreground">
                              Registrar logs detalhados
                            </p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Status da Última Sincronização</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Última Sincronização</p>
                            <p className="text-2xl font-bold">Nunca</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <p className="text-2xl font-bold text-yellow-500">Pendente</p>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Server className="mr-2 h-4 w-4" />
                          Sincronizar Agora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="importacao">
                <Card>
                  <CardHeader>
                    <CardTitle>Importação de Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 font-medium">Arraste arquivos ou clique para upload</p>
                      <p className="text-sm text-muted-foreground">
                        Suporta arquivos CSV, XLS, XLSX
                      </p>
                      <Button variant="outline" className="mt-4">
                        <FileUp className="mr-2 h-4 w-4" />
                        Selecionar Arquivo
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Substituir Dados Existentes</Label>
                          <p className="text-sm text-muted-foreground">
                            Sobrescrever registros duplicados
                          </p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Validação Prévia</Label>
                          <p className="text-sm text-muted-foreground">
                            Verificar dados antes da importação
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        Iniciar Importação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </div>
    </div>
  )
}