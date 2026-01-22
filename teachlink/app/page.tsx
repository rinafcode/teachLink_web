import MobileLearningInterface from "@/components/mobile/MobileLearningInterface";
import { offlineStorage } from "@/services/offlineStorage";

export default function Home() {
  offlineStorage.init();
  return <MobileLearningInterface />;
}
