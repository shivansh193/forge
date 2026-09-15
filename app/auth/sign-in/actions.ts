"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export interface SignInState {
  error: string;
}

export async function signInWithEmail(_prevState: SignInState | null, formData: FormData): Promise<SignInState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: error.message || "Couldn't sign in with those credentials." };

  redirect("/");
}
