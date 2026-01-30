import CourseCard from "./components/courses/CourseCard";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome to <span className="text-blue-400">TeachLink</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Learn anytime, anywhere with our comprehensive platform
          </p>
          
          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Link 
              href="/dashboard" 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">🖥️</div>
              <h3 className="text-xl font-semibold mb-2">Desktop Dashboard</h3>
              <p className="text-gray-400">Full-featured learning platform with advanced tools</p>
            </Link>
            
            <Link 
              href="/mobile-app" 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-xl font-semibold mb-2">Mobile App</h3>
              <p className="text-gray-400">Touch-optimized learning experience for on-the-go</p>
            </Link>
            
            <Link 
              href="/courses/1" 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-xl font-semibold mb-2">Course Catalog</h3>
              <p className="text-gray-400">Browse and explore available courses</p>
            </Link>
          </div>
        </div>
      </header>

      {/* Featured Courses Section */}
      <div className="px-4 py-10 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Courses</h2>
          
          <div className="
            grid grid-cols-1 
            md:grid-cols-2 
            lg:grid-cols-3 
            gap-6 xl:gap-8
          ">
            {/* Card 1 - Web3 UX */}
            <CourseCard
              title="Web3 UX Design Principles"
              subtitle="Create intuitive interfaces for decentralized applications"
              author="Sarah Johnson"
              progress={68}
              timeRemaining="12h remaining"
              imageUrl="https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg"
            />

            {/* Card 2 - Security */}
            <CourseCard
              title="Smart Contract Security Best Practices"
              subtitle="Learn to secure your Cairo smart contracts against vulnerabilities"
              author="Michael Chen"
              progress={45}
              timeRemaining="12h remaining"
              imageUrl="https://static.vecteezy.com/system/resources/previews/053/715/379/non_2x/abstract-green-digital-rain-with-matrix-code-in-futuristic-cyber-background-perfect-for-technology-and-data-themed-visuals-png.png"
            />

            {/* Card 3 - Scaling */}
            <CourseCard
              title="Scaling DAPps on Starknet"
              subtitle="Techniques for building scalable decentralized applications"
              author="Alex Rivera"
              progress={12}
              timeRemaining="12h remaining"
              imageUrl="https://thumbs.dreamstime.com/b/futuristic-laptop-glowing-digital-waves-emerging-screen-dark-setting-399809314.jpg"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 md:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why TeachLink?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3">Offline Learning</h3>
              <p className="text-gray-400">Download courses and learn without internet connection</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Cross-Platform</h3>
              <p className="text-gray-400">Seamless experience across desktop, mobile, and tablet</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3">Web3 Integration</h3>
              <p className="text-gray-400">Decentralized platform with blockchain-based features</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-16 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to start learning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of learners on TeachLink today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}