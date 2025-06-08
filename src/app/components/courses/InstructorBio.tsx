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
  imageUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3",
  expertise = ["React", "Node.js", "TypeScript", "AWS"],
  socialLinks = {
    linkedin: "https://linkedin.com/in/johndoe",
    twitter: "https://twitter.com/johndoe",
    github: "https://github.com/johndoe"
  }
}: InstructorBioProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">About the Instructor</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 relative h-64">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-lg"
          />
        </div>
        <div className="md:w-2/3">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <p className="text-gray-600 mb-4">{title}</p>
          <p className="text-gray-700 mb-6">{bio}</p>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Areas of Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {expertise.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600"
              >
                LinkedIn
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-400"
              >
                Twitter
              </a>
            )}
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900"
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 