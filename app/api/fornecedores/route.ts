// app/api/fornecedores/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Definindo os fornecedores permitidos
const allowedFornecedores = ["FORNECEDORES ES", "FORNECEDORES SP", "FORNECEDORES RJ"]

// Função auxiliar para obter o último cod_inventario da tabela ativo_inventario_hb
async function getMaxCodInventario() {
  const { data, error } = await supabase
    .from('ativo_inventario_hb')
    .select('cod_inventario')
    .order('cod_inventario', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) {
    throw new Error(`Erro ao obter o último cod_inventario: ${error?.message}`)
  }
  return data[0].cod_inventario
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fornecedor, ativo, quantidade } = body

    // Validação dos parâmetros obrigatórios
    if (!fornecedor || !ativo || quantidade === undefined) {
      return NextResponse.json(
        { error: "Parâmetros 'fornecedor', 'ativo' e 'quantidade' são obrigatórios." },
        { status: 400 }
      )
    }

    // Verifica se o fornecedor está entre os permitidos
    if (!allowedFornecedores.includes(fornecedor)) {
      return NextResponse.json(
        { error: "Fornecedor inválido. Permitidos: " + allowedFornecedores.join(", ") },
        { status: 400 }
      )
    }

    // Obter o último cod_inventario da tabela ativo_inventario_hb
    const cod_inventario = await getMaxCodInventario()

    // Inserir o registro na tabela ativo_fornecedores
    const { data, error } = await supabase
      .from('ativo_fornecedores')
      .insert([{ cod_inventario, fornecedor, ativo, quantidade }])
    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
