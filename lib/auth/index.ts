import { createClient } from "@/lib/supabase/client";
import type { SignInFormData, SignUpFormData } from "./schemas";

export async function signIn({ email, password }: SignInFormData) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function signUp({ email, password, firstName, lastName, phone }: SignUpFormData) {
  const supabase = createClient();

  try {
    // Sign up the user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // Check if it's a database error
      if (authError.message.includes("Database error")) {
        return { error: "Unable to create account. Please try again later." };
      }
      return { error: authError.message };
    }

    // If user was created successfully and we have a user ID, try to ensure profile exists
    if (authData.user) {
      // Wait a moment for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to create/update profile directly as a fallback
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          email: authData.user.email!,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: "client",
        })
        .select()
        .single();

      // Don't fail signup if profile creation fails
      if (profileError) {
        console.warn("Profile creation warning:", profileError);
      }
    }

    return { data: authData };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(password: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getSession() {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}
