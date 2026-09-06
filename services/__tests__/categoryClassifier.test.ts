import { describe, it, expect } from 'vitest';
import { classifyLink } from '@/services/categoryClassifier';
import type { LinkMetadata } from '@/store/types';

const emptyMeta: LinkMetadata = { title: '' };

describe('classifyLink', () => {
  it('classifies github as code regardless of text', () => {
    expect(classifyLink('https://github.com/foo/bar', 'github', emptyMeta)).toBe('code');
  });

  it('classifies by keywords in the url', () => {
    expect(classifyLink('https://example.com/tutorial/xyz', 'unknown', emptyMeta)).toBe('education');
    expect(classifyLink('https://example.com/news/today', 'unknown', emptyMeta)).toBe('news');
    expect(classifyLink('https://example.com/game/videos', 'unknown', emptyMeta)).toBe('entertainment');
  });

  it('classifies by keywords in the title', () => {
    const meta: LinkMetadata = { title: 'How to learn react in 10 minutes' };
    expect(classifyLink('https://example.com/x', 'unknown', meta)).toBe('education');
  });

  it('classifies by keywords in the description', () => {
    const meta: LinkMetadata = { title: 'Something', description: 'A deep dive into a programming bug' };
    expect(classifyLink('https://example.com/x', 'unknown', meta)).toBe('code');
  });

  it('is case-insensitive', () => {
    const meta: LinkMetadata = { title: 'BREAKING UPDATE' };
    expect(classifyLink('https://example.com/x', 'unknown', meta)).toBe('news');
  });

  it('falls back to random', () => {
    const meta: LinkMetadata = { title: 'Completely unrelated thing' };
    expect(classifyLink('https://example.com/x', 'unknown', meta)).toBe('random');
  });
});