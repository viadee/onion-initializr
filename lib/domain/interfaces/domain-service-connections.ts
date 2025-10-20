export interface DomainServiceConnections {
  [domainServiceName: string]: string[];
}
export interface AppServiceDependencies {
  domainServices: string[];
  repositories: string[];
}
export interface ApplicationServiceDependencyMap {
  [applicationServiceName: string]: AppServiceDependencies;
}
