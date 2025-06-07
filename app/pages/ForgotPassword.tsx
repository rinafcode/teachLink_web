
import { ForgotPasswordForm } from "@/auth/components/ForgotPasswordForm";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <div className="w-full max-w-md bg-card rounded-lg shadow-sm border p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h2 className="mt-6 text-2xl font-bold">Reset your password</h2>
        </div>
        
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
