"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export interface SignUpState {
  error: string;
}

export async function signUpWithEmail(_prevState: SignUpState | null, formData: FormData): Promise<SignUpState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();

  const { error } = await auth.signUp.email({ email, password, name: name || email });
  if (error) return { error: error.message || "Couldn't create that account." };

  // Neon Auth seeds the session cookie as part of sign-up (no separate
  // sign-in step), so this can go straight to the workspace — GET
  // /api/agents seeds the two preset agents on this first request.
  redirect("/");
}
