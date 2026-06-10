// import { NextRequest, NextResponse } from 'next/server'
// import { verifyToken } from '@/lib/auth'
// import { uploadService } from '@/services/upload.service'
// import { userRepository } from '@/repositories/user.repository'
// import { hasPermission } from '@/lib/rbac'

// export async function POST(req: NextRequest) {
//   try {
//     // 1. Verify token
//     const { userId } = verifyToken(req)

//     // 2. Check permission
//     const user = await userRepository.findById(userId)
//     if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
//     if (!hasPermission(user.role as any, 'document:upload')) {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
//     }

//     // 3. Parse form data
//     const formData = await req.formData()
//     const file = formData.get('file') as File
//     const title = formData.get('title') as string

//     if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
//     if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

//     // 4. Validate file type
//     const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
//     if (!allowedTypes.includes(file.type)) {
//       return NextResponse.json({ error: 'Only PDF and DOCX files allowed' }, { status: 400 })
//     }

//     // 5. Validate file size (10MB max)
//     if (file.size > 10 * 1024 * 1024) {
//       return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
//     }

//     // 6. Upload file
//     const document = await uploadService.uploadFile(file, userId, title)

//     return NextResponse.json({ message: 'File uploaded successfully', document }, { status: 201 })

//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 })
//   }
// }

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { uploadService } from '@/services/upload.service'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { aiService } from '@/services/ai.service'

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:upload')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files allowed' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    // 1. Upload file to Supabase + save metadata to DB
    const document = await uploadService.uploadFile(file, userId, title)

    // 2. Trigger AI processing in background
    await aiService.processDocument({
      document_id: document.id,
      file_url: document.fileUrl,
      file_type: document.fileType,
      user_id: userId,
    })

    return NextResponse.json({ message: 'File uploaded and processing started', document }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}