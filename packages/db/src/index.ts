import { PrismaClient } from './generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const env = (globalThis as any).process?.env as { NODE_ENV?: string } | undefined

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env?.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (env?.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from './generated/prisma'