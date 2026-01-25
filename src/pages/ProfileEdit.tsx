import "../app/globals.css";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import { Toaster } from "react-hot-toast";

export default function ProfileEdit() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your profile, preferences, and account settings
          </p>
        </div>

        <ProfileEditForm />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
