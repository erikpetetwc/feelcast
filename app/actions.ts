"use server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function credentialsSignIn(
  email: string,
  password: string
): Promise<{ error: string } | { success: true }> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    // NEXT_REDIRECT means sign-in succeeded — cookie is set, return success
    // so the client can do a hard navigation (fixes iOS Safari cookie timing)
    if ((error as Error & { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      return { success: true };
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
  return { success: true };
}
