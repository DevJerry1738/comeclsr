import { describe, expect, it } from 'vitest';
import { formatAgentDistanceLabel } from '../src/lib/agentDistance';

describe('formatAgentDistanceLabel', () => {
  it('formats a useful sentence for the user-facing distance label', () => {
    expect(formatAgentDistanceLabel('Alicia', 10)).toBe('Alicia is 10 hours away');
  });

  it('returns null when no offset is configured', () => {
    expect(formatAgentDistanceLabel('Alicia', null)).toBeNull();
  });
});
