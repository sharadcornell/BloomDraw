// Input validation (docs/08 §2 transform style validation + envelope inputs).
import { AppError } from '../errors.ts';
import {
  parseJsonBody,
  readDeviceId,
  validateAgeRange,
  validateImageSource,
  validatePrompt,
  validateStyle,
  validateStyles,
} from '../validation.ts';

function fakeHeaders(map: Record<string, string>) {
  return { get: (name: string) => (name in map ? map[name] : null) };
}

describe('validatePrompt', () => {
  it('trims and accepts a valid prompt', () => {
    expect(validatePrompt('  a cat  ')).toBe('a cat');
  });
  it('rejects empty / oversized / non-string', () => {
    expect(() => validatePrompt('   ')).toThrow(AppError);
    expect(() => validatePrompt('x'.repeat(301))).toThrow(AppError);
    expect(() => validatePrompt(42)).toThrow(AppError);
  });
});

describe('validateAgeRange', () => {
  it('passes through valid bands, allows omission, rejects junk', () => {
    expect(validateAgeRange(undefined)).toBeUndefined();
    expect(validateAgeRange('6-8')).toBe('6-8');
    expect(() => validateAgeRange('99')).toThrow(AppError);
  });
});

describe('transform style validation', () => {
  it('accepts a valid style and rejects an invalid one', () => {
    expect(validateStyle('line_art')).toBe('line_art');
    expect(() => validateStyle('watercolor')).toThrow(AppError);
  });
  it('defaults styles[] to all four, dedupes, and validates each', () => {
    expect(validateStyles(undefined)).toEqual(['line_art', 'sketch', 'cartoon', 'coloring_page']);
    expect(validateStyles(['sketch', 'sketch'])).toEqual(['sketch']);
    expect(() => validateStyles([])).toThrow(AppError);
    expect(() => validateStyles(['nope'])).toThrow(AppError);
  });
});

describe('validateImageSource', () => {
  it('requires exactly one of imageUrl | uploadRef', () => {
    expect(validateImageSource({ imageUrl: 'https://x/y.jpg' })).toEqual({
      imageUrl: 'https://x/y.jpg',
      key: 'https://x/y.jpg',
    });
    expect(validateImageSource({ uploadRef: 'user-uploads/d/u.jpg' })).toEqual({
      uploadRef: 'user-uploads/d/u.jpg',
      key: 'user-uploads/d/u.jpg',
    });
    expect(() => validateImageSource({ imageUrl: 'a', uploadRef: 'b' })).toThrow(AppError);
    expect(() => validateImageSource({})).toThrow(AppError);
  });
});

describe('readDeviceId', () => {
  it('reads a valid id, ignores missing/short', () => {
    expect(readDeviceId(fakeHeaders({ 'x-device-id': '550e8400-e29b-41d4-a716-446655440000' }))).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(readDeviceId(fakeHeaders({}))).toBeUndefined();
    expect(readDeviceId(fakeHeaders({ 'x-device-id': 'short' }))).toBeUndefined();
  });
});

describe('parseJsonBody', () => {
  it('returns a parsed object', async () => {
    await expect(parseJsonBody({ json: async () => ({ a: 1 }) })).resolves.toEqual({ a: 1 });
  });
  it('rejects arrays and invalid JSON', async () => {
    await expect(parseJsonBody({ json: async () => [1, 2] })).rejects.toThrow(AppError);
    await expect(
      parseJsonBody({
        json: async () => {
          throw new Error('bad');
        },
      }),
    ).rejects.toThrow(AppError);
  });
});
