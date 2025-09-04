export interface ITemplatePathService {
  getTemplatePath(relativePath: string): string;
  getEntityTemplatePath(): string;
  getRepoTemplatePath(): string;
  getIRepoTemplatePath(): string;
  getDomainServiceTemplatePath(): string;
  getApplicationServiceTemplatePath(): string;
  getShowcaseTemplatePath(templateName: string): string;
}
