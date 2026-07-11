import { describe, expect, it } from 'vitest';
import { formatAgentDistanceLabel } from './agentDistance';

describe('formatAgentDistanceLabel', () => {
  it('returns the user-facing sentence for a configured offset', () => {
    expect(formatAgentDistanceLabel('Alicia', 10)).toBe('Alicia is 10 hours away');
  });

  it('returns null when the offset is missing', () => {
    expect(formatAgentDistanceLabel('Alicia', null)).toBeNull();
  });
});
