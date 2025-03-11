// app/api/acompanhamento/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import lojasDataRaw from '@/lib/lojas.json'

// Função para normalizar strings (remover acentos e converter para maiúsculas)
function normalizeString(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

interface LojasJson {
  lojas: string[]
}
const lojasData = lojasDataRaw as LojasJson

// Função auxiliar para obter o último cod_inventario da tabela ativo_contagemlojas
async function getMaxCodContagem() {
  const { data, error } = await supabase
    .from('ativo_contagemlojas')
    .select('cod_inventario')
    .order('cod_inventario', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) {
    throw new Error(`Erro ao obter o último cod_inventario: ${error?.message}`)
  }
  return data[0].cod_inventario
}

export async function GET() {
  try {
    // Total de lojas no JSON
    const totalLojas = lojasData.lojas.length
    // Cria uma lista normalizada das lojas
    const lojasNorm = lojasData.lojas.map(loja => normalizeString(loja))

    // Obtém o último cod_inventario da tabela ativo_contagemlojas
    const maxCod = await getMaxCodContagem()
    const { data: contagemData, error: contagemError } = await supabase
      .from('ativo_contagemlojas')
      .select('setor')
      .eq('cod_inventario', maxCod)
    if (contagemError) {
      throw new Error(contagemError.message)
    }
    // Cria um conjunto com as lojas que já foram contadas (normalizadas)
    const countedStores = new Set(
      contagemData.map((row: any) => normalizeString(row.setor))
    )

    // Lojas pendentes: aquelas presentes no JSON, mas não contadas
    const pendingStores = lojasNorm.filter(store => !countedStores.has(store))

    // Consulta a tabela ativos_dadoscadastral para obter os regionais das lojas
    const { data: cadastralData, error: cadastralError } = await supabase
      .from('ativos_dadoscadastral')
      .select('id, loja, regional')
    if (cadastralError) {
      throw new Error(cadastralError.message)
    }
    // Cria um mapeamento: nome normalizado da loja => regional
    const storeRegionalMap: Record<string, string> = {}
    cadastralData.forEach((row: any) => {
      const normalizedLoja = normalizeString(row.loja)
      storeRegionalMap[normalizedLoja] = row.regional
    })

    // Agrupa as lojas pendentes por regional
    const pendentesPorRegional: Record<string, string[]> = {}
    pendingStores.forEach(store => {
      const regional = storeRegionalMap[store] || "Sem Regional"
      if (!pendentesPorRegional[regional]) {
        pendentesPorRegional[regional] = []
      }
      // Recupera o nome original da loja
      const original = lojasData.lojas.find(name => normalizeString(name) === store) || store
      pendentesPorRegional[regional].push(original)
    })

    // Calcula o percentual do inventário realizado
    const totalCounted = countedStores.size
    const percentual = (totalCounted / totalLojas) * 100

    const responseData = {
      totalLojas,
      totalContadas: totalCounted,
      percentual: Number(percentual.toFixed(2)),
      pendentes: pendentesPorRegional,
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
