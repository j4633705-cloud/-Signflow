import dns from 'node:dns/promises';

export const generateVerificationToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const verifyDomainOwnership = async (domain: string, expectedToken: string): Promise<boolean> => {
  try {
    const records = await dns.resolveTxt(domain);
    const flatRecords = records.flat().map((r) => r.replace(/^"|"$/g, ''));
    return flatRecords.some((r) => r === `signflow-verify=${expectedToken}`);
  } catch {
    return false;
  }
};
