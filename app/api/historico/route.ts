// app/api/historico/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// --- Agrupamento Agregado ---

// Agrupa os registros de uma tabela de contagem (ativo_contagemlojas ou ativo_inventario_hb)
// Somando os valores dos ativos e obtendo a data mínima e máxima para cada cod_inventario.
function agruparContagem(rows: any[]): Record<number, { minDate: string; maxDate: string; total: number }> {
  const grupos: Record<number, { minDate: string; maxDate: string; total: number }> = {}
  rows.forEach((row) => {
    const cod = row.cod_inventario
    const data = row.data
    const total =
      (row.caixa_hb_623 || 0) +
      (row.caixa_hb_618 || 0) +
      (row.caixa_hnt_g || 0) +
      (row.caixa_hnt_p || 0) +
      (row.caixa_chocolate || 0) +
      (row.caixa_bin || 0)
    if (!grupos[cod]) {
      grupos[cod] = { minDate: data, maxDate: data, total }
    } else {
      if (new Date(data) < new Date(grupos[cod].minDate)) {
        grupos[cod].minDate = data
      }
      if (new Date(data) > new Date(grupos[cod].maxDate)) {
        grupos[cod].maxDate = data
      }
      grupos[cod].total += total
    }
  })
  return grupos
}

// Agrupa os registros de trânsito (ativo_dadostransito) por cod_inventario,
// somando a coluna "quantidade" e obtendo data mínima e máxima.
function agruparTransito(rows: any[]): Record<number, { minDate: string; maxDate: string; total: number }> {
  const grupos: Record<number, { minDate: string; maxDate: string; total: number }> = {}
  rows.forEach((row) => {
    const cod = row.cod_inventario
    const data = row.data
    const total = row.quantidade || 0
    if (!grupos[cod]) {
      grupos[cod] = { minDate: data, maxDate: data, total }
    } else {
      if (new Date(data) < new Date(grupos[cod].minDate)) {
        grupos[cod].minDate = data
      }
      if (new Date(data) > new Date(grupos[cod].maxDate)) {
        grupos[cod].maxDate = data
      }
      grupos[cod].total += total
    }
  })
  return grupos
}

// --- Agrupamento Detalhado por Setor (já existente) ---

// Para as tabelas de contagem: agrupa por cod_inventario e depois por setor, somando os ativos.
function agruparContagemDetalhado(rows: any[]): Record<number, { detalhes: { [setor: string]: number }, minDate: string, maxDate: string, total: number }> {
  const grupos: Record<number, { detalhes: { [setor: string]: number }, minDate: string, maxDate: string, total: number }> = {}
  rows.forEach((row) => {
    const cod = row.cod_inventario
    const data = row.data
    const setor = row.setor || "Sem setor"
    const totalAtivo =
      (row.caixa_hb_623 || 0) +
      (row.caixa_hb_618 || 0) +
      (row.caixa_hnt_g || 0) +
      (row.caixa_hnt_p || 0) +
      (row.caixa_chocolate || 0) +
      (row.caixa_bin || 0)
    if (!grupos[cod]) {
      grupos[cod] = { detalhes: {}, minDate: data, maxDate: data, total: 0 }
    }
    if (new Date(data) < new Date(grupos[cod].minDate)) {
      grupos[cod].minDate = data
    }
    if (new Date(data) > new Date(grupos[cod].maxDate)) {
      grupos[cod].maxDate = data
    }
    grupos[cod].total += totalAtivo
    if (!grupos[cod].detalhes[setor]) {
      grupos[cod].detalhes[setor] = 0
    }
    grupos[cod].detalhes[setor] += totalAtivo
  })
  return grupos
}

// Para a tabela de trânsito: agrupa por cod_inventario, depois por setor e por tipo_caixa.
function agruparTransitoDetalhado(rows: any[]): Record<number, { detalhes: { [setor: string]: { [tipo_caixa: string]: number } }, minDate: string, maxDate: string, total: number }> {
  const grupos: Record<number, { detalhes: { [setor: string]: { [tipo_caixa: string]: number } }, minDate: string, maxDate: string, total: number }> = {}
  rows.forEach((row) => {
    const cod = row.cod_inventario
    const data = row.data
    const setor = row.setor || "Sem setor"
    const tipo = row.tipo_caixa
    const quantidade = row.quantidade || 0
    if (!grupos[cod]) {
      grupos[cod] = { detalhes: {}, minDate: data, maxDate: data, total: 0 }
    }
    if (new Date(data) < new Date(grupos[cod].minDate)) {
      grupos[cod].minDate = data
    }
    if (new Date(data) > new Date(grupos[cod].maxDate)) {
      grupos[cod].maxDate = data
    }
    grupos[cod].total += quantidade
    if (!grupos[cod].detalhes[setor]) {
      grupos[cod].detalhes[setor] = {}
    }
    if (!grupos[cod].detalhes[setor][tipo]) {
      grupos[cod].detalhes[setor][tipo] = 0
    }
    grupos[cod].detalhes[setor][tipo] += quantidade
  })
  return grupos
}

// --- NOVO: Agrupamento Detalhado por Ativo (por loja/setor) ---
// Para as tabelas de contagem: agrupa por cod_inventario, depois por loja (setor) e separa os ativos individualmente.
function agruparContagemPorAtivoDetalhado(rows: any[]): Record<number, { detalhes: { [setor: string]: { [ativo: string]: number } }, minDate: string, maxDate: string }> {
  const grupos: Record<number, { detalhes: { [setor: string]: { [ativo: string]: number } }, minDate: string, maxDate: string }> = {}
  rows.forEach((row) => {
    const cod = row.cod_inventario
    const data = row.data
    const setor = row.setor || "Sem setor"
    if (!grupos[cod]) {
      grupos[cod] = {
        minDate: data,
        maxDate: data,
        detalhes: {},
      }
    } else {
      if (new Date(data) < new Date(grupos[cod].minDate)) {
        grupos[cod].minDate = data
      }
      if (new Date(data) > new Date(grupos[cod].maxDate)) {
        grupos[cod].maxDate = data
      }
    }
    if (!grupos[cod].detalhes[setor]) {
      grupos[cod].detalhes[setor] = {
        "CAIXA HB 623": 0,
        "CAIXA HB 618": 0,
        "CAIXA HNT G": 0,
        "CAIXA HNT P": 0,
        "CAIXA BASCULHANTE": 0,
        "CAIXA BIN": 0,
      }
    }
    grupos[cod].detalhes[setor]["CAIXA HB 623"] += row.caixa_hb_623 || 0
    grupos[cod].detalhes[setor]["CAIXA HB 618"] += row.caixa_hb_618 || 0
    grupos[cod].detalhes[setor]["CAIXA HNT G"] += row.caixa_hnt_g || 0
    grupos[cod].detalhes[setor]["CAIXA HNT P"] += row.caixa_hnt_p || 0
    grupos[cod].detalhes[setor]["CAIXA BASCULHANTE"] += row.caixa_chocolate || 0
    grupos[cod].detalhes[setor]["CAIXA BIN"] += row.caixa_bin || 0
  })
  return grupos
}

// --- Combinação dos Dados Agregados ---
// Combina os dados dos três agrupamentos em um histórico geral (agregados)
function combinarHistorico(
  gruposLojas: Record<number, { minDate: string; maxDate: string; total: number }>,
  gruposInventario: Record<number, { minDate: string; maxDate: string; total: number }>,
  gruposTransito: Record<number, { minDate: string; maxDate: string; total: number }>
) {
  const cods = new Set<number>([
    ...Object.keys(gruposLojas).map(Number),
    ...Object.keys(gruposInventario).map(Number),
    ...Object.keys(gruposTransito).map(Number),
  ])
  const historico = Array.from(cods).map((cod) => {
    const datasMin: string[] = []
    const datasMax: string[] = []
    if (gruposLojas[cod]) {
      datasMin.push(gruposLojas[cod].minDate)
      datasMax.push(gruposLojas[cod].maxDate)
    }
    if (gruposInventario[cod]) {
      datasMin.push(gruposInventario[cod].minDate)
      datasMax.push(gruposInventario[cod].maxDate)
    }
    if (gruposTransito[cod]) {
      datasMin.push(gruposTransito[cod].minDate)
      datasMax.push(gruposTransito[cod].maxDate)
    }
    const dataInicio = datasMin.length
      ? new Date(Math.min(...datasMin.map((d) => new Date(d).getTime()))).toISOString().split("T")[0]
      : ""
    const dataFim = datasMax.length
      ? new Date(Math.max(...datasMax.map((d) => new Date(d).getTime()))).toISOString().split("T")[0]
      : ""
    return {
      cod_inventario: cod,
      dataInicio,
      dataFim,
      contagemLojas: gruposLojas[cod]?.total || 0,
      contagemInventarioHB: gruposInventario[cod]?.total || 0,
      contagemTransito: gruposTransito[cod]?.total || 0,
    }
  })
  historico.sort((a, b) => b.cod_inventario - a.cod_inventario)
  return historico
}

// --- Handlers da API ---

export async function GET() {
  try {
    // Consulta as 3 tabelas (para contagem, incluindo "setor")
    const { data: dataLojas, error: errorLojas } = await supabase
      .from('ativo_contagemlojas')
      .select('cod_inventario, data, setor, caixa_hb_623, caixa_hb_618, caixa_hnt_g, caixa_hnt_p, caixa_chocolate, caixa_bin')
    if (errorLojas) throw new Error(errorLojas.message)

    const { data: dataInventario, error: errorInventario } = await supabase
      .from('ativo_inventario_hb')
      .select('cod_inventario, data, setor, caixa_hb_623, caixa_hb_618, caixa_hnt_g, caixa_hnt_p, caixa_chocolate, caixa_bin')
    if (errorInventario) throw new Error(errorInventario.message)

    const { data: dataTransito, error: errorTransito } = await supabase
      .from('ativo_dadostransito')
      .select('cod_inventario, data, setor, tipo_caixa, quantidade')
    if (errorTransito) throw new Error(errorTransito.message)

    // Agrupamento agregado
    const gruposLojas = agruparContagem(dataLojas)
    const gruposInventario = agruparContagem(dataInventario)
    const gruposTransito = agruparTransito(dataTransito)
    const historico = combinarHistorico(gruposLojas, gruposInventario, gruposTransito)

    // Agrupamento detalhado por setor (já existente)
    const detalhesLojas = agruparContagemDetalhado(dataLojas)
    const detalhesInventario = agruparContagemDetalhado(dataInventario)
    const detalhesTransito = agruparTransitoDetalhado(dataTransito)

    // NOVO: Agrupamento detalhado por ativo (separado por loja) para as tabelas de contagem
    const porAtivoDetalhadoLojas = agruparContagemPorAtivoDetalhado(dataLojas)
    const porAtivoDetalhadoInventario = agruparContagemPorAtivoDetalhado(dataInventario)

    const responseData = {
      historico,
      detalhes: {
        ativo_contagemlojas: detalhesLojas,
        ativo_inventario_hb: detalhesInventario,
        ativo_dadostransito: detalhesTransito,
      },
      por_ativo: {
        ativo_contagemlojas: porAtivoDetalhadoLojas,
        ativo_inventario_hb: porAtivoDetalhadoInventario,
      },
    }
    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST para gerar planilha (CSV) de download com os dados agregados
export async function POST(request: Request) {
  try {
    const { data: dataLojas, error: errorLojas } = await supabase
      .from('ativo_contagemlojas')
      .select('cod_inventario, data, caixa_hb_623, caixa_hb_618, caixa_hnt_g, caixa_hnt_p, caixa_chocolate, caixa_bin')
    if (errorLojas) throw new Error(errorLojas.message)

    const { data: dataInventario, error: errorInventario } = await supabase
      .from('ativo_inventario_hb')
      .select('cod_inventario, data, caixa_hb_623, caixa_hb_618, caixa_hnt_g, caixa_hnt_p, caixa_chocolate, caixa_bin')
    if (errorInventario) throw new Error(errorInventario.message)

    const { data: dataTransito, error: errorTransito } = await supabase
      .from('ativo_dadostransito')
      .select('cod_inventario, data, quantidade')
    if (errorTransito) throw new Error(errorTransito.message)

    const gruposLojas = agruparContagem(dataLojas)
    const gruposInventario = agruparContagem(dataInventario)
    const gruposTransito = agruparTransito(dataTransito)
    const historico = combinarHistorico(gruposLojas, gruposInventario, gruposTransito)

    const headers = ["cod_inventario", "dataInicio", "dataFim", "contagemLojas", "contagemInventarioHB", "contagemTransito"]
    const csvRows = [headers.join(",")]
    historico.forEach((item) => {
      const row = [
        item.cod_inventario,
        item.dataInicio,
        item.dataFim,
        item.contagemLojas,
        item.contagemInventarioHB,
        item.contagemTransito,
      ]
      csvRows.push(row.join(","))
    })
    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="historico.csv"',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
