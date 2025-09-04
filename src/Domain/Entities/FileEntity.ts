/**
 * Entity representing a file to be created.
 */
export class FileEntity {
  constructor(
    public filePath: string,
    public content: string
  ) {}
}
