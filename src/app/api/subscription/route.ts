import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subcriptionEnds = new Date();
    subcriptionEnds.setMonth(subcriptionEnds.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subcriptionEnds: subcriptionEnds,
      },
    });

    return NextResponse.json({
      message: "Subscription successful",
      subcriptionEnds: updatedUser.subcriptionEnds,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSubscribed: true, subcriptionEnds: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    if (user.subcriptionEnds && user.subcriptionEnds < now) {
      await prisma.user.update({
        where: { id: userId },
        data: { isSubscribed: false, subcriptionEnds: null },
      });
      return NextResponse.json({ isSubscribed: false, subscriptionEnds: null });
    }

    return NextResponse.json({
      isSubscribed: user.isSubscribed,
      subscriptionEnds: user.subcriptionEnds,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 