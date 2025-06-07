import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <h2 className="mt-6 text-2xl font-bold">Forgot your password?</h2>
      <p className="mt-2 text-muted-foreground">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <div className="space-y-6">
        <ForgotPasswordForm />
        
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
} 