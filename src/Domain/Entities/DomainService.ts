import { Entity } from './Entity';

/**
 * Domain Entity: DomainService
 */
export class DomainService {
  constructor(
    public serviceName: string,
    public entities: Entity[],
    public useAngularDI: boolean = false
  ) {}
}
