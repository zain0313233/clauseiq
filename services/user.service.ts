import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userRepository } from '@/repositories/user.repository'
import { SignupInput, LoginInput } from '@/validators/auth.schema'

const JWT_SECRET = process.env.JWT_SECRET!

export const userService = {
  signup: async (input: SignupInput) => {
    const existing = await userRepository.findByEmail(input.email)
    if (existing) throw new Error('Email already in use')

    const hashedPassword = await bcrypt.hash(input.password, 10)

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  },

  login: async (input: LoginInput) => {
    const user = await userRepository.findByEmail(input.email)
    if (!user) throw new Error('Invalid email or password')

    const isValid = await bcrypt.compare(input.password, user.password)
    if (!isValid) throw new Error('Invalid email or password')

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    return {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    }
  },
}