import NodeFS from "node:fs/promises";
import NodeOS from "node:os";
import NodePath from "node:path";
import pkg from "../../package.json" with { type: "json" };

type ProjectContext = {
  root: string;
  path: (relativeFilePath: string) => string;
  chdir: () => void;
};

export async function withProject<T>(
  files: Record<string, string>,
  run: (project: ProjectContext) => Promise<T>,
): Promise<T> {
  const initialCwd = process.cwd();
  const root = await NodeFS.realpath(
    await NodeFS.mkdtemp(NodePath.join(NodeOS.tmpdir(), `${pkg.name}-`)),
  );

  const project: ProjectContext = {
    root,
    path: (relativeFilePath) => {
      if (NodePath.isAbsolute(relativeFilePath)) {
        throw new Error("Project file path must be relative");
      }

      return NodePath.join(root, relativeFilePath);
    },
    chdir: () => {
      process.chdir(root);
    },
  };

  try {
    for (const [relativeFilePath, content] of Object.entries(files)) {
      const filePath = project.path(relativeFilePath);

      await NodeFS.mkdir(NodePath.dirname(filePath), { recursive: true });
      await NodeFS.writeFile(filePath, content, "utf8");
    }

    return await run(project);
  } finally {
    process.chdir(initialCwd);
    await NodeFS.rm(root, { recursive: true, force: true });
  }
}
