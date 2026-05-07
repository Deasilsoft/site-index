const CONTENT_TYPE_BY_EXT = {
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
} as const;

type FileExtension = keyof typeof CONTENT_TYPE_BY_EXT;
type ContentType = (typeof CONTENT_TYPE_BY_EXT)[FileExtension];

const FILE_EXTENSIONS = Object.keys(CONTENT_TYPE_BY_EXT) as FileExtension[];

export class Artifact {
  readonly filePath: string;
  readonly content: string;
  readonly contentType: ContentType;

  constructor(input: { filePath: string; content: string }) {
    const extension = FILE_EXTENSIONS.find((extension) =>
      input.filePath.endsWith(extension),
    );

    if (!extension) {
      throw new Error(`Unsupported artifact file extension: ${input.filePath}`);
    }

    this.filePath = input.filePath;
    this.content = input.content;
    this.contentType = CONTENT_TYPE_BY_EXT[extension];

    Object.freeze(this);
  }
}
