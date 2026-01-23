import CourseCard from "./components/courses/CourseCard";


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10 md:px-8">

      {/* Example of how to use course card component */}
      <div className="
          max-w-7xl mx-auto
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
          imageUrl="https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg" // or use a foggy forest one
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
  );
}
