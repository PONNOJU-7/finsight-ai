import { ConfigService } from '@nestjs/config';

/** True when analysis/chat use local heuristics instead of Anthropic (no API key/credits). */
export function isMockAiEnabled(config: ConfigService): boolean {
  const provider = (config.get<string>('AI_PROVIDER') ?? 'anthropic').toLowerCase();
  const mockFlag = (config.get<string>('MOCK_CLAUDE') ?? 'false').toLowerCase();
  return provider === 'mock' || mockFlag === 'true' || mockFlag === '1';
}