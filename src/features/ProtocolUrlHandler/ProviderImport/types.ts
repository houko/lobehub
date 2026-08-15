import type { AiProviderSourceType } from '@/types/aiProvider';

export interface ExistingProviderPreview {
  id: string;
  name: string;
  source: AiProviderSourceType;
}
