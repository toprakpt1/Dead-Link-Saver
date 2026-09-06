import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  isValidUrl,
  cleanUrl,
  canonicalKey,
  extractUrls,
  normalizeUrl,
} from '@/services/linkParser';

describe('detectPlatform', () => {
  it('detects youtube links', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('youtube');
  });

  it('detects reddit links', () => {
    expect(detectPlatform('https://www.reddit.com/r/reactjs/comments/abc123/foo/')).toBe('reddit');
  });

  it('detects twitter/x links', () => {
    expect(detectPlatform('https://twitter.com/foo/status/123456789')).toBe('twitter');
    expect(detectPlatform('https://x.com/foo/status/123456789')).toBe('twitter');
  });

  it('detects github links', () => {
    expect(detectPlatform('https://github.com/facebook/react')).toBe('github');
  });

  it('detects instagram links', () => {
    expect(detectPlatform('https://www.instagram.com/p/abc123/')).toBe('instagram');
    expect(detectPlatform('https://www.instagram.com/reel/abc123/')).toBe('instagram');
  });

  it('detects medium links', () => {
    expect(detectPlatform('https://medium.com/@someauthor/some-post')).toBe('medium');
  });

  it('detects twitch links', () => {
    expect(detectPlatform('https://www.twitch.tv/somechannel')).toBe('twitch');
  });

  it('detects discord links', () => {
    expect(detectPlatform('https://discord.com/invite/abc123')).toBe('discord');
    expect(detectPlatform('https://discordapp.com/invite/abc123')).toBe('discord');
  });

  it('detects spotify links', () => {
    expect(detectPlatform('https://open.spotify.com/track/123456789')).toBe('spotify');
    expect(detectPlatform('https://spotify.com/album/123456789')).toBe('spotify');
  });

  it('detects linkedin links', () => {
    expect(detectPlatform('https://www.linkedin.com/in/someone')).toBe('linkedin');
    expect(detectPlatform('https://www.linkedin.com/company/acme')).toBe('linkedin');
  });

  it('detects article/blog links', () => {
    expect(detectPlatform('https://blog.example.com/posts/foo')).toBe('article');
    expect(detectPlatform('https://foo.wordpress.com/bar')).toBe('article');
    expect(detectPlatform('https://news.ycombinator.com/article/123')).toBe('article');
  });

  it('returns unknown for unrecognized links', () => {
    expect(detectPlatform('https://example.com/some/page')).toBe('unknown');
    expect(detectPlatform('https://random-site.org')).toBe('unknown');
  });

  it('is case-insensitive', () => {
    expect(detectPlatform('HTTPS://GITHUB.COM/facebook/react')).toBe('github');
  });
});

describe('isValidUrl', () => {
  it('accepts http and https urls', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path?q=1#frag')).toBe(true);
  });

  it('rejects non-http protocols and garbage', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });
});

describe('cleanUrl', () => {
  it('strips utm_* params', () => {
    expect(cleanUrl('https://example.com/page?utm_source=twitter&utm_medium=social&id=5')).toBe(
      'https://example.com/page?id=5'
    );
  });

  it('strips known tracking params', () => {
    expect(cleanUrl('https://example.com/page?fbclid=abc&gclid=def')).toBe('https://example.com/page');
    expect(cleanUrl('https://example.com/page?ref=home&si=xyz')).toBe('https://example.com/page');
  });

  it('removes trailing empty fragment', () => {
    expect(cleanUrl('https://example.com/page#')).toBe('https://example.com/page');
  });

  it('keeps meaningful query params', () => {
    expect(cleanUrl('https://example.com/search?q=hello&utm_campaign=x')).toBe(
      'https://example.com/search?q=hello'
    );
  });

  it('returns trimmed input as-is when unparseable', () => {
    expect(cleanUrl('   ')).toBe('');
  });
});

describe('canonicalKey', () => {
  it('normalizes youtube variants to the same key', () => {
    const a = canonicalKey('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
    const b = canonicalKey('https://youtu.be/dQw4w9WgXcQ');
    const c = canonicalKey('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(a).toBe('youtube:dQw4w9WgXcQ');
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('drops www and lowercases the host', () => {
    expect(canonicalKey('https://WWW.Example.com/Path')).toBe('example.com/Path?');
  });

  it('sorts query params so ordering does not matter', () => {
    expect(canonicalKey('https://example.com/x?a=1&b=2')).toBe(
      canonicalKey('https://example.com/x?b=2&a=1')
    );
  });

  it('removes trailing slashes from the path', () => {
    expect(canonicalKey('https://example.com/page/')).toBe('example.com/page?');
  });
});

describe('extractUrls', () => {
  it('finds urls inside prose', () => {
    expect(extractUrls('check this https://example.com/foo and that')).toEqual([
      'https://example.com/foo',
    ]);
  });

  it('strips trailing punctuation', () => {
    expect(extractUrls('See https://example.com/foo.')).toEqual(['https://example.com/foo']);
    expect(extractUrls('(see https://example.com/foo)')).toEqual(['https://example.com/foo']);
    expect(extractUrls('link: https://example.com/foo, ok')).toEqual(['https://example.com/foo']);
  });

  it('extracts multiple urls', () => {
    expect(extractUrls('a https://one.com b https://two.com/x c')).toEqual([
      'https://one.com',
      'https://two.com/x',
    ]);
  });

  it('keeps balanced parens that are part of the url', () => {
    expect(extractUrls('https://en.wikipedia.org/wiki/Foo_(bar)/details')).toEqual([
      'https://en.wikipedia.org/wiki/Foo_(bar)/details',
    ]);
  });

  it('returns empty array when no urls', () => {
    expect(extractUrls('no links here')).toEqual([]);
  });
});

describe('normalizeUrl', () => {
  it('prepends https when protocol missing', () => {
    expect(normalizeUrl('example.com/page')).toBe('https://example.com/page');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com/page  ')).toBe('https://example.com/page');
  });

  it('cleans tracking params', () => {
    expect(normalizeUrl('example.com/page?utm_source=x')).toBe('https://example.com/page');
  });

  it('keeps http protocol as-is', () => {
    expect(normalizeUrl('http://example.com/page')).toBe('http://example.com/page');
  });
});