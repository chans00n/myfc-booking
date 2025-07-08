import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <SignInForm className="w-full max-w-sm" />
    </div>
  );
}
