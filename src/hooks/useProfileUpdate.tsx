import { useState } from "react";
import { toast } from "react-hot-toast";

interface ProfileData {
  name: string;
  email: string;
  bio?: string;
  avatar?: File | null;
  notifications: {
    email: boolean;
    push: boolean;
  };
  theme: "light" | "dark";
}

export function useProfileUpdate() {
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = async (data: ProfileData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Profile updated:", data);
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading };
}
