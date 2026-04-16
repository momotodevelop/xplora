const ISO_DURATION_RE =
  /^P(?:(?<days>\d+(?:[.,]\d+)?)D)?(?:T(?:(?<hours>\d+(?:[.,]\d+)?)H)?(?:(?<minutes>\d+(?:[.,]\d+)?)M)?(?:(?<seconds>\d+(?:[.,]\d+)?)S)?)?$/i;

function parsePart(value?: string): number {
  if (!value) {
    return 0;
  }

  return Number.parseFloat(value.replace(',', '.'));
}

export function parseIsoDurationMs(value: string): number {
  const match = ISO_DURATION_RE.exec(value.trim());
  if (!match?.groups) {
    return 0;
  }

  const days = parsePart(match.groups['days']);
  const hours = parsePart(match.groups['hours']);
  const minutes = parsePart(match.groups['minutes']);
  const seconds = parsePart(match.groups['seconds']);

  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

export function formatDurationShortEs(value: string, largest = 2): string {
  let remainingMs = parseIsoDurationMs(value);
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return '';
  }

  const units = [
    { label: 'Dia', ms: 24 * 60 * 60 * 1000 },
    { label: 'Hr', ms: 60 * 60 * 1000 },
    { label: 'Min', ms: 60 * 1000 },
  ];

  const parts: string[] = [];
  for (const unit of units) {
    if (parts.length >= largest) {
      break;
    }

    const amount = Math.floor(remainingMs / unit.ms);
    if (amount <= 0) {
      continue;
    }

    parts.push(`${amount} ${unit.label}`);
    remainingMs -= amount * unit.ms;
  }

  if (!parts.length) {
    const minutes = Math.max(1, Math.round(remainingMs / (60 * 1000)));
    return `${minutes} Min`;
  }

  return parts.join(' y ');
}
