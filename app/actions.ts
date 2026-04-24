"use server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function credentialsSignIn(email: string, password: string): Promise<{ error: string } | void> {
  console.log("[credentialsSignIn] called:", email);
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      console.log("[credentialsSignIn] auth error:", error.type, error.message);
      return { error: "Invalid email or password" };
    }
    console.log("[credentialsSignIn] redirect destination:", (error as any)?.digest ?? (error as Error)?.message);
    throw error;
  }
}
