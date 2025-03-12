// app/api/finalizar_inventario/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Tipos dos ativos para cada modo
type AtivosHB = "CAIXA HB 623" | "CAIXA HB 618"
type AtivosHNT = "CAIXA HNT G" | "CAIXA HNT P"

// Retorna o maior cod_inventario da tabela ativo_inventario_hb
async function getMaxCod(table: string): Promise<number> {
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
// Permite filtrar por setor ou excluir determinados setores
async function fetchContagem(
  table: string, 
  cod_inventario: number, 
  filterSetor?: string, 
  excludeSetorList?: string[]
): Promise<any[]> {
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
async function fetchTransito(
  table: string, 
  cod_inventario: number, 
  setor: string, 
  tipo: string
): Promise<any[]> {
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
async function fetchFornecedores(
  table: string, 
  cod_inventario: number, 
  fornecedor: string, 
  ativo: string
): Promise<any[]> {
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
async function getResultadoAtual(cod_inventario: number, mode: string): Promise<any> {
  const { data, error } = await supabase
    .from('ativo_resultado_inv')
    .select('*')
    .eq('cod_inventario', cod_inventario)
    .eq('mode', mode)
  if (error) throw new Error(error.message)
  console.log(`[getResultadoAtual] Inventario: ${cod_inventario}, mode: ${mode}, Resultado:`, data)
  return data && data.length > 0 ? data[0] : null
}

// Função genérica para agrupar registros por setor, considerando dois campos
function groupBySetor(rows: any[], field1: string, field2: string): { [setor: string]: { value1: number, value2: number } } {
  const grouped: { [setor: string]: { value1: number, value2: number } } = {}
  for (const row of rows) {
    const setor = row.setor
    if (!grouped[setor]) {
      grouped[setor] = { value1: 0, value2: 0 }
    }
    grouped[setor].value1 += row[field1] || 0
    grouped[setor].value2 += row[field2] || 0
  }
  console.log(`[groupBySetor] Agrupado por setor:`, grouped)
  return grouped
}

export async function POST(request: Request) {
  try {
    const { mode } = await request.json()
    console.log(`[POST] Mode recebido: ${mode}`)
    if (!mode || (mode !== "inventariohb" && mode !== "inventariohnt")) {
      return NextResponse.json({ error: "Parâmetro 'mode' inválido. Use 'inventariohb' ou 'inventariohnt'." }, { status: 400 })
    }
    
    // Obtemos o inventário atual (maior cod_inventario da tabela ativo_inventario_hb)
    const currentInventario = await getMaxCod('ativo_inventario_hb')
    console.log(`[POST] Inventário atual: ${currentInventario}`)

    const existingResult = await getResultadoAtual(currentInventario, mode)
    if (existingResult) {
      return NextResponse.json({ error: "Inventário atual já finalizado." }, { status: 400 })
    }

    // Variáveis para os totais finais e detalhamento
    let total1 = 0  // para ativo 1 (inventariohb: caixa_hb_623, inventariohnt: caixa_hnt_g)
    let total2 = 0  // para ativo 2 (inventariohb: caixa_hb_618, inventariohnt: caixa_hnt_p)

    let resultado_lojas: { [setor: string]: { value1: number, value2: number } } = {}
    let total_lojas_1 = 0, total_lojas_2 = 0

    let resultado_CD_ES: { 
      contagem: { value1: number, value2: number },
      transito: { value1: number, value2: number },
      fornecedor: { value1: number, value2: number },
      total: { value1: number, value2: number }
    } = {
      contagem: { value1: 0, value2: 0 },
      transito: { value1: 0, value2: 0 },
      fornecedor: { value1: 0, value2: 0 },
      total: { value1: 0, value2: 0 },
    }
    let resultado_CD_SP = { 
      contagem: { value1: 0, value2: 0 },
      transito: { value1: 0, value2: 0 },
      fornecedor: { value1: 0, value2: 0 },
      total: { value1: 0, value2: 0 },
    }
    let resultado_CD_RJ = { 
      contagem: { value1: 0, value2: 0 },
      transito: { value1: 0, value2: 0 },
      fornecedor: { value1: 0, value2: 0 },
      total: { value1: 0, value2: 0 },
    }

    // Processamento para cada modo
    if (mode === "inventariohb") {
      console.log("[POST] Processando inventariohb")
      // Para inventariohb:
      // - Contagem: campos: caixa_hb_623 e caixa_hb_618
      // - Transito e Fornecedor: tipos: "CAIXA HB 623" e "CAIXA HB 618"
      const rowsLojas = await fetchContagem('ativo_contagemlojas', currentInventario, undefined, ["CD SP", "CD ES", "CD PAVUNA"])
      resultado_lojas = groupBySetor(rowsLojas, 'caixa_hb_623', 'caixa_hb_618')
      for (const setor in resultado_lojas) {
        total_lojas_1 += resultado_lojas[setor].value1
        total_lojas_2 += resultado_lojas[setor].value2
      }
      
      // Regional CD ES
      const rowsES = await fetchContagem('ativo_contagemlojas', currentInventario, "CD ES")
      const es_contagem_1 = sumField(rowsES, 'caixa_hb_623')
      const es_contagem_2 = sumField(rowsES, 'caixa_hb_618')
      const es_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HB 623"), 'quantidade')
      const es_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HB 618"), 'quantidade')
      const es_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HB 623"), 'quantidade')
      const es_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HB 618"), 'quantidade')
      resultado_CD_ES = {
        contagem: { value1: es_contagem_1, value2: es_contagem_2 },
        transito: { value1: es_transito_1, value2: es_transito_2 },
        fornecedor: { value1: es_fornecedor_1, value2: es_fornecedor_2 },
        total: {
          value1: es_contagem_1 + es_transito_1 + es_fornecedor_1,
          value2: es_contagem_2 + es_transito_2 + es_fornecedor_2,
        }
      }
      
      // Regional CD SP
      const rowsSP = await fetchContagem('ativo_contagemlojas', currentInventario, "CD SP")
      const sp_contagem_1 = sumField(rowsSP, 'caixa_hb_623')
      const sp_contagem_2 = sumField(rowsSP, 'caixa_hb_618')
      const sp_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HB 623"), 'quantidade')
      const sp_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HB 618"), 'quantidade')
      const sp_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HB 623"), 'quantidade')
      const sp_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HB 618"), 'quantidade')
      resultado_CD_SP = {
        contagem: { value1: sp_contagem_1, value2: sp_contagem_2 },
        transito: { value1: sp_transito_1, value2: sp_transito_2 },
        fornecedor: { value1: sp_fornecedor_1, value2: sp_fornecedor_2 },
        total: {
          value1: sp_contagem_1 + sp_transito_1 + sp_fornecedor_1,
          value2: sp_contagem_2 + sp_transito_2 + sp_fornecedor_2,
        }
      }
      
      // Regional CD RJ (setor "CD PAVUNA")
      const rowsRJ = await fetchContagem('ativo_contagemlojas', currentInventario, "CD PAVUNA")
      const rj_contagem_1 = sumField(rowsRJ, 'caixa_hb_623')
      const rj_contagem_2 = sumField(rowsRJ, 'caixa_hb_618')
      const rj_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HB 623"), 'quantidade')
      const rj_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HB 618"), 'quantidade')
      const rj_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HB 623"), 'quantidade')
      const rj_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HB 618"), 'quantidade')
      resultado_CD_RJ = {
        contagem: { value1: rj_contagem_1, value2: rj_contagem_2 },
        transito: { value1: rj_transito_1, value2: rj_transito_2 },
        fornecedor: { value1: rj_fornecedor_1, value2: rj_fornecedor_2 },
        total: {
          value1: rj_contagem_1 + rj_transito_1 + rj_fornecedor_1,
          value2: rj_contagem_2 + rj_transito_2 + rj_fornecedor_2,
        }
      }
      
      const total_final_1 = total_lojas_1 + resultado_CD_ES.total.value1 + resultado_CD_SP.total.value1 + resultado_CD_RJ.total.value1
      const total_final_2 = total_lojas_2 + resultado_CD_ES.total.value2 + resultado_CD_SP.total.value2 + resultado_CD_RJ.total.value2
      
      total1 = total_final_1
      total2 = total_final_2
      
      console.log("[inventariohb] Totais finais:", { total_final_1, total_final_2 })
    } else {
      console.log("[POST] Processando inventariohnt")
      // Para inventariohnt, os campos são:
      // - Contagem: campos: caixa_hnt_g e caixa_hnt_p
      // - Transito e Fornecedor: tipos: "CAIXA HNT G" e "CAIXA HNT P"
      const rowsLojas = await fetchContagem('ativo_contagemlojas', currentInventario, undefined, ["CD SP", "CD ES", "CD PAVUNA"])
      resultado_lojas = groupBySetor(rowsLojas, 'caixa_hnt_g', 'caixa_hnt_p')
      for (const setor in resultado_lojas) {
        total_lojas_1 += resultado_lojas[setor].value1
        total_lojas_2 += resultado_lojas[setor].value2
      }
      
      // Regional CD ES
      const rowsES = await fetchContagem('ativo_contagemlojas', currentInventario, "CD ES")
      const es_contagem_1 = sumField(rowsES, 'caixa_hnt_g')
      const es_contagem_2 = sumField(rowsES, 'caixa_hnt_p')
      const es_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HNT G"), 'quantidade')
      const es_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD ES", "CAIXA HNT P"), 'quantidade')
      const es_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HNT G"), 'quantidade')
      const es_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES ES", "CAIXA HNT P"), 'quantidade')
      resultado_CD_ES = {
        contagem: { value1: es_contagem_1, value2: es_contagem_2 },
        transito: { value1: es_transito_1, value2: es_transito_2 },
        fornecedor: { value1: es_fornecedor_1, value2: es_fornecedor_2 },
        total: {
          value1: es_contagem_1 + es_transito_1 + es_fornecedor_1,
          value2: es_contagem_2 + es_transito_2 + es_fornecedor_2,
        }
      }
      
      // Regional CD SP
      const rowsSP = await fetchContagem('ativo_contagemlojas', currentInventario, "CD SP")
      const sp_contagem_1 = sumField(rowsSP, 'caixa_hnt_g')
      const sp_contagem_2 = sumField(rowsSP, 'caixa_hnt_p')
      const sp_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HNT G"), 'quantidade')
      const sp_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD SP", "CAIXA HNT P"), 'quantidade')
      const sp_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HNT G"), 'quantidade')
      const sp_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES SP", "CAIXA HNT P"), 'quantidade')
      resultado_CD_SP = {
        contagem: { value1: sp_contagem_1, value2: sp_contagem_2 },
        transito: { value1: sp_transito_1, value2: sp_transito_2 },
        fornecedor: { value1: sp_fornecedor_1, value2: sp_fornecedor_2 },
        total: {
          value1: sp_contagem_1 + sp_transito_1 + sp_fornecedor_1,
          value2: sp_contagem_2 + sp_transito_2 + sp_fornecedor_2,
        }
      }
      
      // Regional CD RJ (setor "CD PAVUNA")
      const rowsRJ = await fetchContagem('ativo_contagemlojas', currentInventario, "CD PAVUNA")
      const rj_contagem_1 = sumField(rowsRJ, 'caixa_hnt_g')
      const rj_contagem_2 = sumField(rowsRJ, 'caixa_hnt_p')
      const rj_transito_1 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HNT G"), 'quantidade')
      const rj_transito_2 = sumField(await fetchTransito('ativo_dadostransito', currentInventario, "CD PAVUNA", "CAIXA HNT P"), 'quantidade')
      const rj_fornecedor_1 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HNT G"), 'quantidade')
      const rj_fornecedor_2 = sumField(await fetchFornecedores('ativo_fornecedores', currentInventario, "FORNECEDORES RJ", "CAIXA HNT P"), 'quantidade')
      resultado_CD_RJ = {
        contagem: { value1: rj_contagem_1, value2: rj_contagem_2 },
        transito: { value1: rj_transito_1, value2: rj_transito_2 },
        fornecedor: { value1: rj_fornecedor_1, value2: rj_fornecedor_2 },
        total: {
          value1: rj_contagem_1 + rj_transito_1 + rj_fornecedor_1,
          value2: rj_contagem_2 + rj_transito_2 + rj_fornecedor_2,
        }
      }
      
      const total_final_1 = total_lojas_1 + resultado_CD_ES.total.value1 + resultado_CD_SP.total.value1 + resultado_CD_RJ.total.value1
      const total_final_2 = total_lojas_2 + resultado_CD_ES.total.value2 + resultado_CD_SP.total.value2 + resultado_CD_RJ.total.value2
      
      total1 = total_final_1
      total2 = total_final_2
      
      console.log("[inventariohnt] Totais finais:", { total_final_1, total_final_2 })
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
      if (mode === "inventariohb") {
        diff1 = total1 - prevResult.caixa_hb_623
        diff2 = total2 - prevResult.caixa_hb_618
      } else {
        diff1 = total1 - prevResult.caixa_hnt_g
        diff2 = total2 - prevResult.caixa_hnt_p
      }
    }
    console.log("[POST] Diferenças calculadas:", { diff1, diff2 })

    // Prepara o objeto a inserir na tabela ativo_resultado_inv (somente os totais resumidos)
    const insertObj: any = {
      cod_inventario: currentInventario,
      mode,
      created_at: new Date().toISOString(),
      ...(mode === "inventariohb"
        ? {
            caixa_hb_623: total1,
            caixa_hb_618: total2,
            diff_caixa_hb_623: diff1,
            diff_caixa_hb_618: diff2,
          }
        : {
            caixa_hnt_g: total1,
            caixa_hnt_p: total2,
            diff_caixa_hnt_g: diff1,
            diff_caixa_hnt_p: diff2,
          }),
    }
    console.log("[POST] Objeto a inserir:", insertObj)

    const { data: insertData, error: insertError } = await supabase
      .from('ativo_resultado_inv')
      .insert([insertObj])
    if (insertError) throw new Error(insertError.message)
    console.log("[POST] Registro inserido:", insertData)

    const detalhes = {
      resultado_lojas,
      resultado_CD_ES,
      resultado_CD_SP,
      resultado_CD_RJ,
    }
    console.log("[POST] Detalhamento:", detalhes)

    return NextResponse.json({ success: true, result: insertData && insertData[0] ? insertData[0] : insertObj, detalhes })
  } catch (error: any) {
    console.error("[POST] Erro final:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
