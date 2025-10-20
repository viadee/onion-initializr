export class ShowcaseTemplateFile {
  constructor(
    public readonly template: string,
    public readonly output: string,
    public readonly useAngularDI: boolean = false
  ) {}
}
