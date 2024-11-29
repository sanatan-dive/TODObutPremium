import { PrismaClient } from "@prisma/client";

const prismaClientSinglton = () => {
    return new PrismaClient()
}

type prismaClientSinglton = ReturnType<typeof prismaClientSinglton>

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const prisma = globalForPrisma.prisma ?? prismaClientSinglton()

export default prisma

if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

//this uses a singleton pattern to connect to database if available uses global if not then use create a new isntance