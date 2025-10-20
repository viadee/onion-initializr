/**
 * Represents the different architectural rings in the onion architecture
 */
export class OnionRing {
  static readonly ENTITIES = new OnionRing('Entities');
  static readonly DOMAIN_SERVICES = new OnionRing('Domain Services');
  static readonly APPLICATION_SERVICES = new OnionRing('Application Services');
  static readonly REPOSITORIES = new OnionRing('Repositories');

  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: OnionRing): boolean {
    return this._value === other._value;
  }

  static getAllRings(): OnionRing[] {
    return [
      OnionRing.ENTITIES,
      OnionRing.DOMAIN_SERVICES,
      OnionRing.APPLICATION_SERVICES,
      OnionRing.REPOSITORIES,
    ];
  }
}

/**
 * Type alias for onion ring values - useful for functions that might return null
 */
export type OnionRingType = OnionRing | null;
