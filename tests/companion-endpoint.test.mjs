import assert from 'node:assert/strict';
import test from 'node:test';
import { readCompanionPublicConfig } from '../src/companion/config.ts';
const env = { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-key' };
test('legacy production builds use the owned gateway while explicit test backends remain isolated', () => {
  assert.equal(readCompanionPublicConfig({ ...env, VITE_COMPANION_API_URL: 'https://wendao-companion-api.vercel.app/' }).apiUrl, 'https://wendao.wonderelian.com');
  assert.equal(readCompanionPublicConfig({ ...env, VITE_COMPANION_API_URL: 'https://api.wendao.test' }).apiUrl, 'https://api.wendao.test');
});
