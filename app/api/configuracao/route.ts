// app/api/configuracao/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const allowedTables = [
  'ativo_contagemlojas',
  'ativo_dadostransito',
  'ativo_inventario_hb',
  'ativo_dadoscadastral'
]

// GET: Retorna todos os registros de uma tabela
// Exemplo de uso: GET /api/configuracao?table=ativo_contagemlojas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: "Tabela inválida. Permite: " + allowedTables.join(", ") }, { status: 400 })
    }

    // Busca todos os registros da tabela
    const { data, error } = await supabase
      .from(table)
      .select('*')
    if (error) {
      throw new Error(error.message)
    }
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Atualiza um ou mais registros em uma tabela
// O corpo deve incluir:
//   system_key: string (deve ser igual a process.env.SYSTEM_KEY)
//   table: string (uma das tabelas permitidas)
//   match: objeto para filtrar os registros (por exemplo: { id: 1 })
//   data: objeto com os campos a serem atualizados
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { system_key, table, match, data } = body

    if (!system_key || system_key !== process.env.SYSTEM_KEY) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 })
    }
    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: "Tabela inválida. Permite: " + allowedTables.join(", ") }, { status: 400 })
    }
    if (!match || typeof match !== 'object') {
      return NextResponse.json({ error: "Parâmetro 'match' (filtro) é obrigatório e deve ser um objeto." }, { status: 400 })
    }
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: "Parâmetro 'data' (dados a atualizar) é obrigatório e deve ser um objeto." }, { status: 400 })
    }

    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data)
      .match(match)
    if (error) {
      throw new Error(error.message)
    }
    return NextResponse.json({ success: true, data: updatedData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
