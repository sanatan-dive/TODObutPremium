import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

async function isAdmin(userId: string) {
    const user = await clerkClient.users.getUser(userId)

    return user.publicMetadata.role === "admin"
}