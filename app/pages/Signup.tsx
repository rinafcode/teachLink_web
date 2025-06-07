
import { SignupForm } from "@/auth/components/SignupForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

const Signup = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <Logo size="lg" />
            </Link>
            <h2 className="mt-6 text-2xl font-bold">Create an account</h2>
            <p className="mt-2 text-muted-foreground">Start your journey with TeachLink today</p>
          </div>
          
          <div className="space-y-6">
            <SignupForm />
            
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
          src="/lovable-uploads/e5abf63f-7be8-4da3-bf9c-65be29573750.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 max-w-md text-center bg-black/40 p-8 rounded-lg backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4">Join the knowledge economy</h2>
          <p className="text-lg opacity-90 mb-6">
            Share your expertise, learn from others, and earn rewards on TeachLink.
          </p>
          <Button asChild variant="secondary" size="lg">
            <Link to="/auth/login">Already have an account? Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
