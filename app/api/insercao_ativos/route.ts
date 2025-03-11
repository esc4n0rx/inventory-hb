// app/api/insercao_ativos/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Função auxiliar para obter o maior cod_inventario da tabela
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tabela, ativo, setor, quantidade } = body

    if (!tabela || !ativo || quantidade === undefined) {
      return NextResponse.json(
        { error: "Parâmetros 'tabela', 'ativo' e 'quantidade' são obrigatórios." },
        { status: 400 }
      )
    }

    if (!["ativos_inventario_hb", "ativo_contagemlojas", "ativo_dadostransito"].includes(tabela)) {
      return NextResponse.json({ error: "Tabela inválida." }, { status: 400 })
    }

    // Para os dois primeiros casos é necessário o parâmetro 'setor'
    if ((tabela === "ativos_inventario_hb" || tabela === "ativo_contagemlojas") && !setor) {
      return NextResponse.json(
        { error: "O parâmetro 'setor' é obrigatório para esta tabela." },
        { status: 400 }
      )
    }

    // Obter o cod_inventario mais atual da tabela
    const currentCod = await getMaxCod(tabela)

    if (tabela === "ativos_inventario_hb" || tabela === "ativo_contagemlojas") {
      // Mapeamento para definir em qual coluna inserir a quantidade
      const columnMapping: Record<string, string> = {
        "HB 623": "caixa_hb_623",
        "HB 618": "caixa_hb_618",
        "HNT G": "caixa_hnt_g",
        "HNT P": "caixa_hnt_p",
        "BASCULHANTE": "caixa_chocolate",
        "BIN": "caixa_bin"
      }
      const coluna = columnMapping[ativo]
      if (!coluna) {
        return NextResponse.json(
          { error: "Ativo inválido para a tabela informada." },
          { status: 400 }
        )
      }

      const insertObj: Record<string, any> = {
        cod_inventario: currentCod,
        setor: setor
      }
      insertObj[coluna] = quantidade

      const { data, error } = await supabase.from(tabela).insert(insertObj)
      if (error) {
        throw new Error(error.message)
      }
      return NextResponse.json({ success: true, data })
    } else if (tabela === "ativo_dadostransito") {
      // Para ativos_dadostransito, insere-se:
      // - cod_inventario: o mais atual
      // - setor: conforme informado
      // - tipo_caixa: recebe o valor de 'ativo'
      // - quantidade: conforme informado
      if (!setor) {
        return NextResponse.json(
          { error: "O parâmetro 'setor' é obrigatório para ativos_dadostransito." },
          { status: 400 }
        )
      }
      const insertObj = {
        cod_inventario: currentCod,
        setor,
        tipo_caixa: ativo,
        quantidade
      }
      const { data, error } = await supabase.from(tabela).insert(insertObj)
      if (error) {
        throw new Error(error.message)
      }
      return NextResponse.json({ success: true, data })
    } else {
      return NextResponse.json({ error: "Tabela não suportada." }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
