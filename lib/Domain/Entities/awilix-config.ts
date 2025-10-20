/**
 * Domain Entity: AwilixConfig
 */
export class AwilixConfig {
  constructor(
    public readonly folderPath: string,
    public readonly entities: string[],
    public readonly domainServices: string[],
    public readonly applicationServices: string[]
  ) {}
}
