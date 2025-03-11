// app/api/finalizar_inventario/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Tipos de ativos para o modo inventariohb
type AtivosHB = "CAIXA HB 623" | "CAIXA HB 618"

// Retorna o maior cod_inventario da tabela, usado para identificar o inventário atual
async function getMaxCod(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select('cod_inventario')
    .order('cod_inventario', { ascending: false })
    .limit(1)
  console.log(`[getMaxCod] Tabela: ${table}, Data:`, data)
  if (error || !data || data.length === 0) {
    throw new Error(`Erro ao obter max cod_inventario de ${table}: ${error?.message}`)
  }
  return data[0].cod_inventario
}

// Função para somar um campo numérico de um array de registros
function sumField(rows: any[], field: string): number {
  const sum = rows.reduce((acc, row) => acc + (row[field] || 0), 0)
  console.log(`[sumField] Campo: ${field}, Soma: ${sum}`)
  return sum
}

// Função para buscar dados da tabela de contagem (ativo_contagemlojas)
async function fetchContagem(table: string, cod_inventario: number, filterSetor?: string, excludeSetorList?: string[]) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('cod_inventario', cod_inventario)
  if (error) throw new Error(error.message)
  let rows = data || []
  if (filterSetor) {
    rows = rows.filter((row: any) => row.setor === filterSetor)
  }
  if (excludeSetorList) {
    rows = rows.filter((row: any) => !excludeSetorList.includes(row.setor))
  }
  console.log(`[fetchContagem] Tabela: ${table}, Inventario: ${cod_inventario}, Filter: ${filterSetor || 'none'}, Registros: ${rows.length}`)
  return rows
}

// Função para buscar dados de trânsito (ativo_dadostransito)
async function fetchTransito(table: string, cod_inventario: number, setor: string, tipo: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('cod_inventario', cod_inventario)
    .eq('setor', setor)
    .eq('tipo_caixa', tipo)
  if (error) throw new Error(error.message)
  console.log(`[fetchTransito] Tabela: ${table}, Inventario: ${cod_inventario}, Setor: ${setor}, Tipo: ${tipo}, Registros: ${data?.length}`)
  return data || []
}

// Função para buscar dados de fornecedores (ativo_fornecedores)
async function fetchFornecedores(table: string, cod_inventario: number, fornecedor: string, ativo: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('cod_inventario', cod_inventario)
    .eq('fornecedor', fornecedor)
    .eq('ativo', ativo)
  if (error) throw new Error(error.message)
  console.log(`[fetchFornecedores] Tabela: ${table}, Inventario: ${cod_inventario}, Fornecedor: ${fornecedor}, Ativo: ${ativo}, Registros: ${data?.length}`)
  return data || []
}

// Função para buscar registro de resultado já existente para o inventário atual e modo
async function getResultadoAtual(cod_inventario: number, mode: string) {
  const { data, error } = await supabase
    .from('ativo_resultado_inv')
    .select('*')
    .eq('cod_inventario', cod_inventario)
    .eq('mode', mode)
  if (error) throw new Error(error.message)
  console.log(`[getResultadoAtual] Inventario: ${cod_inventario}, mode: ${mode}, Resultado:`, data)
  return data && data.length > 0 ? data[0] : null
}


function groupBySetor(rows: any[], field623: string, field618: string) {
    const grouped: { [setor: string]: { caixa623: number, caixa618: number } } = {}
    for (const row of rows) {
      const setor = row.setor
      if (!grouped[setor]) {
        grouped[setor] = { caixa623: 0, caixa618: 0 }
      }
      grouped[setor].caixa623 += row[field623] || 0
      grouped[setor].caixa618 += row[field618] || 0
    }
    return grouped
  }

export async function POST(request: Request) {
  try {
    const { mode } = await request.json()
    console.log(`[POST] Mode recebido: ${mode}`)
    if (!mode || (mode !== "inventariohb" && mode !== "inventariohnt")) {
      return NextResponse.json({ error: "Parâmetro 'mode' inválido. Use 'inventariohb' ou 'inventariohnt'." }, { status: 400 })
    }
    
    // Usaremos o cod_inventario mais recente da tabela ativo_inventario_hb
    const currentInventario = await getMaxCod('ativo_inventario_hb')
    console.log(`[POST] Inventário atual: ${currentInventario}`)

    const existingResult = await getResultadoAtual(currentInventario, mode)
    if (existingResult) {
      return NextResponse.json({ error: "Inventário atual já finalizado." }, { status: 400 })
    }

    // Declaração dos agrupamentos de detalhamento para inventariohb
    let resultado_lojas: { [setor: string]: { caixa623: number, caixa618: number } } = {}
    let total_lojas_623 = 0, total_lojas_618 = 0
    let resultado_CD_ES: { contagem: { caixa623: number, caixa618: number }, transito: { caixa623: number, caixa618: number }, fornecedor: { caixa623: number, caixa618: number }, total: { caixa623: number, caixa618: number } } = {
      contagem: { caixa623: 0, caixa618: 0 },
      transito: { caixa623: 0, caixa618: 0 },
      fornecedor: { caixa623: 0, caixa618: 0 },
      total: { caixa623: 0, caixa618: 0 }
    }
    let resultado_CD_SP = { 
      contagem: { caixa623: 0, caixa618: 0 },
      transito: { caixa623: 0, caixa618: 0 },
      fornecedor: { caixa623: 0, caixa618: 0 },
      total: { caixa623: 0, caixa618: 0 }
    }
    let resultado_CD_RJ = { 
      contagem: { caixa623: 0, caixa618: 0 },
      transito: { caixa623: 0, caixa618: 0 },
      fornecedor: { caixa623: 0, caixa618: 0 },
      total: { caixa623: 0, caixa618: 0 }
    }

    let total1 = 0  // para "CAIXA HB 623"
    let total2 = 0  // para "CAIXA HB 618"

    if (mode === "inventariohb") {
      console.log("[POST] Processando inventariohb")
      // Dados de lojas (não regionais)
      const rowsLojas = await fetchContagem('ativo_contagemlojas', currentInventario, undefined, ["CD SP", "CD ES", "CD PAVUNA"])
      resultado_lojas = groupBySetor(rowsLojas, 'caixa_hb_623', 'caixa_hb_618')
      for (const setor in resultado_lojas) {
        total_lojas_623 += resultado_lojas[setor].caixa623
        total_lojas_618 += resultado_lojas[setor].caixa618
      }
      
      // Dados regionais para CD ES
      const rowsES = await fetchContagem('ativo_contagemlojas', currentInventario, "CD ES")
      const es_contagem_623 = sumField(rowsES, 'caixa_hb_623')
      const es_contagem_618 = sumField(rowsES, 'caixa_hb_618')
      const es_transito_623 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HB 623"), 'quantidade')
      const es_transito_618 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HB 618"), 'quantidade')
      const es_fornecedor_623 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HB 623"), 'quantidade')
      const es_fornecedor_618 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HB 618"), 'quantidade')
      resultado_CD_ES = {
        contagem: { caixa623: es_contagem_623, caixa618: es_contagem_618 },
        transito: { caixa623: es_transito_623, caixa618: es_transito_618 },
        fornecedor: { caixa623: es_fornecedor_623, caixa618: es_fornecedor_618 },
        total: {
          caixa623: es_contagem_623 + es_transito_623 + es_fornecedor_623,
          caixa618: es_contagem_618 + es_transito_618 + es_fornecedor_618,
        }
      }
      
      // Dados regionais para CD SP
      const rowsSP = await fetchContagem('ativo_contagemlojas', currentInventario, "CD SP")
      const sp_contagem_623 = sumField(rowsSP, 'caixa_hb_623')
      const sp_contagem_618 = sumField(rowsSP, 'caixa_hb_618')
      const sp_transito_623 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HB 623"), 'quantidade')
      const sp_transito_618 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HB 618"), 'quantidade')
      const sp_fornecedor_623 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HB 623"), 'quantidade')
      const sp_fornecedor_618 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HB 618"), 'quantidade')
      resultado_CD_SP = {
        contagem: { caixa623: sp_contagem_623, caixa618: sp_contagem_618 },
        transito: { caixa623: sp_transito_623, caixa618: sp_transito_618 },
        fornecedor: { caixa623: sp_fornecedor_623, caixa618: sp_fornecedor_618 },
        total: {
          caixa623: sp_contagem_623 + sp_transito_623 + sp_fornecedor_623,
          caixa618: sp_contagem_618 + sp_transito_618 + sp_fornecedor_618,
        }
      }
      
      // Dados regionais para CD RJ (setor "CD PAVUNA")
      const rowsRJ = await fetchContagem('ativo_contagemlojas', currentInventario, "CD PAVUNA")
      const rj_contagem_623 = sumField(rowsRJ, 'caixa_hb_623')
      const rj_contagem_618 = sumField(rowsRJ, 'caixa_hb_618')
      const rj_transito_623 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HB 623"), 'quantidade')
      const rj_transito_618 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HB 618"), 'quantidade')
      const rj_fornecedor_623 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HB 623"), 'quantidade')
      const rj_fornecedor_618 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HB 618"), 'quantidade')
      resultado_CD_RJ = {
        contagem: { caixa623: rj_contagem_623, caixa618: rj_contagem_618 },
        transito: { caixa623: rj_transito_623, caixa618: rj_transito_618 },
        fornecedor: { caixa623: rj_fornecedor_623, caixa618: rj_fornecedor_618 },
        total: {
          caixa623: rj_contagem_623 + rj_transito_623 + rj_fornecedor_623,
          caixa618: rj_contagem_618 + rj_transito_618 + rj_fornecedor_618,
        }
      }
      
      // Consolidação final: soma dos dados de lojas e de cada regional
      const total_final_623 = total_lojas_623 + resultado_CD_ES.total.caixa623 + resultado_CD_SP.total.caixa623 + resultado_CD_RJ.total.caixa623
      const total_final_618 = total_lojas_618 + resultado_CD_ES.total.caixa618 + resultado_CD_SP.total.caixa618 + resultado_CD_RJ.total.caixa618
      
      total1 = total_final_623
      total2 = total_final_618
      
      console.log("[inventariohb] Totais finais:", { total_final_623, total_final_618 })
    } else {
      console.log("[POST] Processando inventariohnt")
      // Implementação similar para inventariohnt (não detalhada aqui)
    }

    // Busca o resultado anterior para calcular a diferença, se existir
    const { data: prevData, error: prevError } = await supabase
      .from('ativo_resultado_inv')
      .select('*')
      .eq('mode', mode)
      .order('cod_inventario', { ascending: false })
      .range(1, 1)
    if (prevError) throw new Error(prevError.message)
    const prevResult = prevData && prevData.length > 0 ? prevData[0] : null
    console.log("[POST] Resultado anterior:", prevResult)
    
    let diff1 = null, diff2 = null
    if (prevResult) {
      diff1 = total1 - prevResult.caixa_hb_623
      diff2 = total2 - prevResult.caixa_hb_618
    }
    console.log("[POST] Diferenças calculadas:", { diff1, diff2 })

    // Prepara o objeto a inserir na tabela ativo_resultado_inv (somente os totais resumidos)
    const insertObj: any = {
      cod_inventario: currentInventario,
      mode,
      created_at: new Date().toISOString(),
      caixa_hb_623: total1,
      caixa_hb_618: total2,
      diff_caixa_hb_623: diff1,
      diff_caixa_hb_618: diff2,
    }
    console.log("[POST] Objeto a inserir:", insertObj)

    const { data: insertData, error: insertError } = await supabase
      .from('ativo_resultado_inv')
      .insert([insertObj])
    if (insertError) throw new Error(insertError.message)
    console.log("[POST] Registro inserido:", insertData)

    // Prepara o objeto de detalhamento para retornar no JSON (não inserido no banco)
    const detalhes = {
      resultado_lojas: resultado_lojas,
      resultado_CD_ES,
      resultado_CD_SP,
      resultado_CD_RJ
    }
    console.log("[POST] Detalhamento:", detalhes)

    return NextResponse.json({ success: true, result: insertData && insertData[0] ? insertData[0] : insertObj, detalhes })
  } catch (error: any) {
    console.error("[POST] Erro final:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


