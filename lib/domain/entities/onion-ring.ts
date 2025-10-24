/**
 * Represents the different architectural rings in the onion architecture
 */
export class OnionRing {
  constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: OnionRing): boolean {
    return this._value === other._value;
  }
}

// Export the onion ring instances
export const ENTITIES = new OnionRing('Entities');
export const DOMAIN_SERVICES = new OnionRing('Domain Services');
export const APPLICATION_SERVICES = new OnionRing('Application Services');
export const REPOSITORIES = new OnionRing('Repositories');

// Export function to get all rings
export function getAllRings(): OnionRing[] {
  return [
    ENTITIES,
    DOMAIN_SERVICES,
    APPLICATION_SERVICES,
    REPOSITORIES,
  ];
}

/**
 * Type alias for onion ring values - useful for functions that might return null
 */
export type OnionRingType = OnionRing | null;
