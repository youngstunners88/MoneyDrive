/**
 * VoiceButton — legacy backward-compat stub.
 * The floating button has been removed. Import VoiceModal from features/voice/VoiceModal instead.
 */

export { VoiceModal } from "../features/voice/VoiceModal";

export interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: number;
  isAdmin: boolean;
}

interface VoiceButtonLegacyProps {
  profile?: { voiceEnabled?: boolean } | null;
  tier: number;
  activeTab?: string;
  isAdmin?: boolean;
}

export default function VoiceButton(_props: VoiceButtonLegacyProps) {
  return null;
}
