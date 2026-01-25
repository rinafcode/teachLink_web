"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfileUpdate } from "../../hooks/useProfileUpdate";
import { User, Mail, FileText } from "lucide-react";
import ImageUploader from "../shared/ImageUploader";
import PreferencesSection from "./PreferencesSection";

// Schema definition
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.any().optional(), 
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
  theme: z.enum(["light", "dark"]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditForm() {
  const { updateProfile, isLoading } = useProfileUpdate();

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "John Doe", 
      email: "john@example.com",
      bio: "Lifelong learner and enthusiast.",
      notifications: {
        email: true,
        push: false,
      },
      theme: "light",
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = methods;

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
  };

  const handleImageSelect = (file: File) => {
    setValue("avatar", file);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Review & Avatar */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="shrink-0 mx-auto sm:mx-0">
              <ImageUploader
                onImageSelect={handleImageSelect}
                initialImageUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              />
              {errors.avatar && (
                <p className="text-red-500 text-sm mt-1 text-center">
                  Image error
                </p>
              )}
            </div>

            <div className="grow space-y-6 w-full">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    {...register("name")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${errors.name ? "border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                    placeholder="Your Name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${errors.email ? "border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <div className="relative group">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <textarea
                    {...register("bio")}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none hover:border-gray-300"
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
                {errors.bio && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Section 2: Preferences */}
          <PreferencesSection />

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium mr-4 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-2 rounded-lg text-white font-medium transition-all shadow-md ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }`}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
