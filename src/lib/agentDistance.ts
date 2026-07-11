export function formatAgentDistanceLabel(
  agentName: string | null | undefined,
  offsetHours: number | string | null | undefined,
): string | null {
  const trimmedName = agentName?.trim();

  if (!trimmedName) {
    return null;
  }

  const normalizedOffset =
    offsetHours === null || offsetHours === undefined || offsetHours === ""
      ? null
      : Number(offsetHours);

  if (normalizedOffset === null || Number.isNaN(normalizedOffset)) {
    return null;
  }

  const absoluteHours = Math.abs(normalizedOffset);
  const pluralSuffix = absoluteHours === 1 ? "hour" : "hours";

  return `${trimmedName} is ${absoluteHours} ${pluralSuffix} away`;
}
