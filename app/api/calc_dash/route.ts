// app/api/calc_dash/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import lojasDataRaw from '@/lib/lojas.json'
import setoresDataRaw from '@/lib/setor.json'
import fs from 'fs'
import path from 'path'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

interface LojasJson {
  lojas: string[]
}

interface SetoresJson {
  setores: string[]
}

const lojasData = lojasDataRaw as LojasJson
const setoresData = setoresDataRaw as SetoresJson

// Função para remover acentos e converter para uppercase
function normalizeString(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

export async function GET(request: Request) {
  // Consulta na tabela ativo_contagemlojas para obter as lojas (campo "setor")
  const { data: lojasFinalizadas, error: errorLojas } = await supabase
    .from('ativo_contagemlojas')
    .select('setor')

  if (errorLojas) {
    return NextResponse.json({ error: errorLojas.message }, { status: 500 })
  }

  // Consulta na tabela ativo_inventario_hb para obter os setores (campo "setor")
  const { data: setoresFinalizados, error: errorSetores } = await supabase
    .from('ativo_inventario_hb')
    .select('setor')

  if (errorSetores) {
    return NextResponse.json({ error: errorSetores.message }, { status: 500 })
  }

  // Converter os nomes para formato normalizado para comparação
  const finishedLojasSet = new Set(
    lojasFinalizadas.map((item) => normalizeString(item.setor))
  )

  const finishedSetoresSet = new Set(
    setoresFinalizados.map((item) => normalizeString(item.setor))
  )

  // Cálculo para as lojas (ativos)
  const totalLojas = lojasData.lojas.length
  const finishedLojas = lojasData.lojas.filter((loja) =>
    finishedLojasSet.has(normalizeString(loja))
  ).length
  const pendingLojas = totalLojas - finishedLojas

  // Cálculo para os setores
  const totalSetores = setoresData.setores.length
  const finishedSetores = setoresData.setores.filter((setor) =>
    finishedSetoresSet.has(normalizeString(setor))
  ).length
  const pendingSetores = totalSetores - finishedSetores

  // Preparando listas detalhadas para o log
  const finishedLojasNames = lojasData.lojas.filter((loja) =>
    finishedLojasSet.has(normalizeString(loja))
  )
  const pendingLojasNames = lojasData.lojas.filter((loja) =>
    !finishedLojasSet.has(normalizeString(loja))
  )
  const finishedSetoresNames = setoresData.setores.filter((setor) =>
    finishedSetoresSet.has(normalizeString(setor))
  )
  const pendingSetoresNames = setoresData.setores.filter((setor) =>
    !finishedSetoresSet.has(normalizeString(setor))
  )

  // Gerar a mensagem de log com análise detalhada
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] Análise do Dashboard:\n` +
    `Lojas:\n` +
    `- Total: ${totalLojas}\n` +
    `- Finalizadas (${finishedLojas}): ${finishedLojasNames.join(', ')}\n` +
    `- Pendentes (${pendingLojas}): ${pendingLojasNames.join(', ')}\n` +
    `Setores:\n` +
    `- Total: ${totalSetores}\n` +
    `- Conferidos (${finishedSetores}): ${finishedSetoresNames.join(', ')}\n` +
    `- Pendentes (${pendingSetores}): ${pendingSetoresNames.join(', ')}\n\n`

  // Determina o caminho do arquivo log.txt na raiz do projeto
  const logFilePath = path.join(process.cwd(), 'log.txt')
  // Anexa a mensagem ao arquivo de log
  fs.appendFileSync(logFilePath, logMessage, 'utf8')

  // Estrutura de resposta para a dashboard com cores definidas
  const responseData = {
    totalAtivos: finishedLojas, // Total de Lojas Finalizadas
    itensFaltantes: pendingLojas, // Lojas pendentes
    itensConferidos: finishedSetores, // Setores já contados
    emInventario: pendingSetores, // Setores pendentes
    // Dados para o gráfico "Status do Inventário" com cores definidas
    statusInventario: [
      { name: 'Conferidos', value: finishedSetores, color: "hsl(var(--chart-1))" },
      { name: 'Em Contagem', value: pendingSetores, color: "hsl(var(--chart-2))" },
      { name: 'Pendentes', value: pendingLojas, color: "hsl(var(--chart-3))" },
    ],
    distribuicaoAtivos: [] // Implementação futura
  }

  return NextResponse.json(responseData)
}
