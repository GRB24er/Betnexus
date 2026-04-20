import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import type { UserDocument } from "@/models/User";

export async function requireAdmin(): Promise<
  | { user: UserDocument; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }
  return { user };
}
