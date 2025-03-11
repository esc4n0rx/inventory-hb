// app/api/inconsistencia/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
    const { setor, ativo, quantidade, foto, obs } = body

    if (!setor || !ativo || quantidade === undefined || !foto) {
      return NextResponse.json(
        { error: "Parâmetros 'setor', 'ativo', 'quantidade' e 'foto' são obrigatórios." },
        { status: 400 }
      )
    }

    const fileName = `inconsistencias/${uuidv4()}.jpg`

    const base64Data = foto.replace(/^data:image\/\w+;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('ativos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Erro no upload da foto: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('ativos')
      .getPublicUrl(fileName)

    const fotoUrl = publicUrlData.publicUrl

    const cod_inventario = await getMaxCodInventario()

    const { data, error } = await supabase
      .from('ativos_inconsistencia')
      .insert([{ cod_inventario, setor, ativo, quantidade, foto: fotoUrl, obs }])
    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
    try {
      const { data, error } = await supabase
        .from('ativos_inconsistencia')
        .select('*')
      if (error) throw new Error(error.message)
      return NextResponse.json({ inconsistencias: data ?? [] })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  
