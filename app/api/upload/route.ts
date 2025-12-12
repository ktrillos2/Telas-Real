import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file received' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${uuidv4()}${path.extname(file.name)}`
        const uploadDir = path.join(process.cwd(), 'public/uploads/custom')

        try {
            await writeFile(path.join(uploadDir, filename), buffer)
        } catch (error) {
            console.error("Error writing file:", error)
            return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
        }

        const fileUrl = `/uploads/custom/${filename}`

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: filename
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        )
    }
}
