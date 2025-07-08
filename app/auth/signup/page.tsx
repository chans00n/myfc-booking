import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <SignUpForm className="w-full max-w-sm" />
    </div>
  );
}
