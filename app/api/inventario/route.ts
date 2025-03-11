// app/api/inventario/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Ativos = 
  | "CAIXA HB 623"
  | "CAIXA HB 618"
  | "CAIXA HNT G"
  | "CAIXA HNT P"
  | "CAIXA BASCULHANTE"
  | "CAIXA BIN"

async function getMaxCod(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select('cod_inventario')
    .order('cod_inventario', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) {
    throw new Error(`Erro ao obter max cod_inventario de ${table}: ${error?.message}`)
  }
  return data[0].cod_inventario
}

async function getPenultimoCod(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select('cod_inventario')
    .order('cod_inventario', { ascending: false })
    .range(1, 1) // 0 é o maior, 1 é o penúltimo
  if (error || !data || data.length === 0) {
    return null
  }
  return data[0].cod_inventario
}

async function getInventarioData(table: string, cod: number): Promise<Record<Ativos, number>> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('cod_inventario', cod)
  if (error || !data) {
    throw new Error(`Erro ao obter dados de ${table} para cod_inventario ${cod}: ${error?.message}`)
  }
  const result: Record<Ativos, number> = {
    "CAIXA HB 623": 0,
    "CAIXA HB 618": 0,
    "CAIXA HNT G": 0,
    "CAIXA HNT P": 0,
    "CAIXA BASCULHANTE": 0,
    "CAIXA BIN": 0
  }
  for (const row of data) {
    result["CAIXA HB 623"] += row.caixa_hb_623 || 0
    result["CAIXA HB 618"] += row.caixa_hb_618 || 0
    result["CAIXA HNT G"] += row.caixa_hnt_g || 0
    result["CAIXA HNT P"] += row.caixa_hnt_p || 0
    result["CAIXA BASCULHANTE"] += row.caixa_chocolate || 0
    result["CAIXA BIN"] += row.caixa_bin || 0
  }
  return result
}

async function getInventarioDataTransito(table: string, cod: number): Promise<{ [setor: string]: { [tipo_caixa: string]: number } }> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('cod_inventario', cod)
  if (error || !data) {
    throw new Error(`Erro ao obter dados de ${table} para cod_inventario ${cod}: ${error?.message}`)
  }
  const transitoGrouped: { [setor: string]: { [tipo_caixa: string]: number } } = {}
  for (const row of data) {
    const setor = row.setor
    const tipoCaixa = row.tipo_caixa
    if (!transitoGrouped[setor]) {
      transitoGrouped[setor] = {}
    }
    if (!transitoGrouped[setor][tipoCaixa]) {
      transitoGrouped[setor][tipoCaixa] = 0
    }
    transitoGrouped[setor][tipoCaixa] += row.quantidade || 0
  }
  return transitoGrouped
}

export async function GET(request: Request) {
  try {
    // --- Dados Lojas (ativo_contagemlojas) ---
    const maxCodLojas = await getMaxCod('ativo_contagemlojas')
    const { data: rowsLojas, error: errorLojas } = await supabase
      .from('ativo_contagemlojas')
      .select('*')
      .eq('cod_inventario', maxCodLojas)
    if (errorLojas || !rowsLojas) {
      throw new Error(errorLojas?.message)
    }
    const dadosLojas: Record<Ativos, number> = {
      "CAIXA HB 623": 0,
      "CAIXA HB 618": 0,
      "CAIXA HNT G": 0,
      "CAIXA HNT P": 0,
      "CAIXA BASCULHANTE": 0,
      "CAIXA BIN": 0
    }
    for (const row of rowsLojas) {
      dadosLojas["CAIXA HB 623"] += row.caixa_hb_623 || 0
      dadosLojas["CAIXA HB 618"] += row.caixa_hb_618 || 0
      dadosLojas["CAIXA HNT G"] += row.caixa_hnt_g || 0
      dadosLojas["CAIXA HNT P"] += row.caixa_hnt_p || 0
      dadosLojas["CAIXA BASCULHANTE"] += row.caixa_chocolate || 0
      dadosLojas["CAIXA BIN"] += row.caixa_bin || 0
    }

    // --- Dados CD (ativo_inventario_hb) ---
    const maxCodCD = await getMaxCod('ativo_inventario_hb')
    const { data: rowsCD, error: errorCD } = await supabase
      .from('ativo_inventario_hb')
      .select('*')
      .eq('cod_inventario', maxCodCD)
    if (errorCD || !rowsCD) {
      throw new Error(errorCD?.message)
    }
    const dadosCD: Record<Ativos, number> = {
      "CAIXA HB 623": 0,
      "CAIXA HB 618": 0,
      "CAIXA HNT G": 0,
      "CAIXA HNT P": 0,
      "CAIXA BASCULHANTE": 0,
      "CAIXA BIN": 0
    }
    for (const row of rowsCD) {
      dadosCD["CAIXA HB 623"] += row.caixa_hb_623 || 0
      dadosCD["CAIXA HB 618"] += row.caixa_hb_618 || 0
      dadosCD["CAIXA HNT G"] += row.caixa_hnt_g || 0
      dadosCD["CAIXA HNT P"] += row.caixa_hnt_p || 0
      dadosCD["CAIXA BASCULHANTE"] += row.caixa_chocolate || 0
      dadosCD["CAIXA BIN"] += row.caixa_bin || 0
    }

    // --- Dados Trânsito (ativo_dadostransito) ---
    const maxCodTransito = await getMaxCod('ativo_dadostransito')
    const { data: rowsTransito, error: errorTransito } = await supabase
      .from('ativo_dadostransito')
      .select('*')
      .eq('cod_inventario', maxCodTransito)
    if (errorTransito || !rowsTransito) {
      throw new Error(errorTransito?.message)
    }
    const transitoGrouped: { [setor: string]: { [tipo_caixa: string]: number } } = {}
    for (const row of rowsTransito) {
      const setor = row.setor // Esperado "CD SP" ou "CD ES"
      const tipoCaixa = row.tipo_caixa
      if (!transitoGrouped[setor]) {
        transitoGrouped[setor] = {}
      }
      if (!transitoGrouped[setor][tipoCaixa]) {
        transitoGrouped[setor][tipoCaixa] = 0
      }
      transitoGrouped[setor][tipoCaixa] += row.quantidade || 0
    }
    const expectedTypes: string[] = [
      "CAIXA HB 623",
      "CAIXA HB 618",
      "CAIXA HNT G",
      "CAIXA HNT P",
      "CAIXA CHOCOLATE", // representa "CAIXA BASCULHANTE" em trânsito
      "CAIXA BIN"
    ]
    const setoresEsperados = ["CD SP", "CD ES"]
    const dadosTransito = setoresEsperados.map(setor => {
      const ativosData = transitoGrouped[setor] || {}
      const ativos = expectedTypes.map(tipo => ({
        name: tipo,
        total: ativosData[tipo] || 0
      }))
      return { setor, ativos }
    })

    // --- Dados Fornecedores (ativo_fornecedores) ---
    const maxCodFornecedores = await getMaxCod('ativo_fornecedores')
    const { data: rowsFornecedores, error: errorFornecedores } = await supabase
      .from('ativo_fornecedores')
      .select('*')
      .eq('cod_inventario', maxCodFornecedores)
    if (errorFornecedores || !rowsFornecedores) {
      throw new Error(errorFornecedores?.message)
    }
    const dadosFornecedores: Record<Ativos, number> = {
      "CAIXA HB 623": 0,
      "CAIXA HB 618": 0,
      "CAIXA HNT G": 0,
      "CAIXA HNT P": 0,
      "CAIXA BASCULHANTE": 0,
      "CAIXA BIN": 0
    }
    for (const row of rowsFornecedores) {
      // Assume que o campo "ativo" na tabela corresponde exatamente aos nomes definidos
      const ativoNome = row.ativo as Ativos
      dadosFornecedores[ativoNome] += row.quantidade || 0
    }

    // --- Cálculo da Diferença (mantém a lógica já existente) ---
    const penultimoCodLojas = await getPenultimoCod('ativo_contagemlojas')
    const penultimoCodCD = await getPenultimoCod('ativo_inventario_hb')
    const penultimoCodTransito = await getPenultimoCod('ativo_dadostransito')

    let diferencaLojas: Record<Ativos, number> = {} as Record<Ativos, number>
    let diferencaCD: Record<Ativos, number> = {} as Record<Ativos, number>
    let diferencaTransito: { [setor: string]: { [tipo: string]: number } } = {}

    if (!penultimoCodLojas) {
      diferencaLojas = {
        "CAIXA HB 623": 9999,
        "CAIXA HB 618": 9999,
        "CAIXA HNT G": 9999,
        "CAIXA HNT P": 9999,
        "CAIXA BASCULHANTE": 9999,
        "CAIXA BIN": 9999
      }
    } else {
      const inventarioAnteriorLojas = await getInventarioData('ativo_contagemlojas', penultimoCodLojas)
      for (const key in dadosLojas) {
        const k = key as Ativos
        diferencaLojas[k] = dadosLojas[k] - (inventarioAnteriorLojas[k] || 0)
      }
    }

    if (!penultimoCodCD) {
      diferencaCD = {
        "CAIXA HB 623": 9999,
        "CAIXA HB 618": 9999,
        "CAIXA HNT G": 9999,
        "CAIXA HNT P": 9999,
        "CAIXA BASCULHANTE": 9999,
        "CAIXA BIN": 9999
      }
    } else {
      const inventarioAnteriorCD = await getInventarioData('ativo_inventario_hb', penultimoCodCD)
      for (const key in dadosCD) {
        const k = key as Ativos
        diferencaCD[k] = dadosCD[k] - (inventarioAnteriorCD[k] || 0)
      }
    }

    if (!penultimoCodTransito) {
      diferencaTransito = {}
      for (const setor of setoresEsperados) {
        diferencaTransito[setor] = {}
        for (const tipo of expectedTypes) {
          diferencaTransito[setor][tipo] = 9999
        }
      }
    } else {
      const inventarioAnteriorTransito = await getInventarioDataTransito('ativo_dadostransito', penultimoCodTransito)
      for (const setor of setoresEsperados) {
        diferencaTransito[setor] = {}
        for (const tipo of expectedTypes) {
          const valorAtual = transitoGrouped[setor]?.[tipo] || 0
          const valorAnterior = inventarioAnteriorTransito[setor]?.[tipo] || 0
          diferencaTransito[setor][tipo] = valorAtual - valorAnterior
        }
      }
    }

    const responseData = {
      dadosLojas,
      dadosCD,
      dadosTransito,
      dadosFornecedores,
      diferenca: {
        lojas: diferencaLojas,
        cd: diferencaCD,
        transito: diferencaTransito
      }
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
