
// import { LoginForm } from "@/auth/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <Logo size="lg" />
            </Link>
            <h2 className="mt-6 text-2xl font-bold">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>
          
          <div className="space-y-6">
            <LoginForm />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full">
                Google
              </Button>
              <Button variant="outline" className="w-full">
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Image Background */}
      <div className="hidden md:flex flex-1 relative items-center justify-center text-white p-8">
        <img
          src="/login-signup-background.jpeg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 max-w-md text-center bg-black/40 p-8 rounded-lg backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4">Unlock a world of knowledge</h2>
          <p className="text-lg opacity-90 mb-6">
            Join thousands of educators and learners on TeachLink, where innovation meets education.
          </p>
          <Button asChild variant="secondary" size="lg">
            <Link to="/auth/signup">Create an account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
