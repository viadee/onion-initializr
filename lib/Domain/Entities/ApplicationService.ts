import { DomainService } from './DomainService';

/**
 * Domain Entity: ApplicationService
 */
export class ApplicationService {
  constructor(
    public name: string,
    public domainServices: DomainService[],
    public repositories: string[],
    public useAngularDI: boolean = false
  ) {}
}
