import Image from 'next/image';

interface InstructorBioProps {
  name?: string;
  title?: string;
  bio?: string;
  imageUrl?: string;
  expertise?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export default function InstructorBio({
  name = "John Doe",
  title = "Senior Web Developer & Instructor",
  bio = "With over 10 years of experience in web development, John has helped thousands of students master modern web technologies. He specializes in React, Node.js, and full-stack development.",
  imageUrl = "https://thumbs.dreamstime.com/b/matrix-style-digital-rain-green-binary-code-falling-downward-direction-abstract-background-depicting-effect-stream-397887374.jpg",
  expertise = ["React", "Node.js", "TypeScript", "AWS"],
  socialLinks = {
    linkedin: "https://linkedin.com/in/johndoe",
    twitter: "https://twitter.com/johndoe",
    github: "https://github.com/johndoe"
  }
}: InstructorBioProps) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-[#0F172A] dark:text-white">About the Instructor</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-1/3 w-full relative h-48 sm:h-64 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-xl"
          />
        </div>
        <div className="sm:w-2/3 flex-1">
          <h3 className="text-xl lg:text-2xl font-semibold mb-2 text-[#0F172A] dark:text-white">{name}</h3>
          <p className="text-[#64748B] dark:text-[#94A3B8] mb-4 text-sm lg:text-base">{title}</p>
          <p className="text-[#475569] dark:text-[#CBD5E1] mb-6 text-sm lg:text-base leading-relaxed">{bio}</p>

          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-[#0F172A] dark:text-white text-sm lg:text-base">Areas of Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill) => (
                <span
                  key={skill}
                  className="bg-[#DBEAFE] dark:bg-[#1E3A8A] text-[#0066FF] dark:text-[#60A5FA] px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </a>
            )}
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0066FF] dark:hover:text-[#00C2FF] transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 