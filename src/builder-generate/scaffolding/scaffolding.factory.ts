import { normalize } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  filter,
  MergeStrategy,
  mergeWith,
  move,
  renameTemplateFiles,
  Rule,
  SchematicsException,
  strings,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { addShortImportToTsConfig } from '../../utils';
import { getDefaultProjectName, getProject, readWorkspace } from '../../utils/Angular';

export function scaffoldingFactory({ root }: { root: string }): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const projectName = getDefaultProjectName(workspace);
    const { sourceRoot, prefix } = getProject(workspace, projectName);

    const folders = ['adapters', 'components', 'models', 'pipes', 'services', 'stores'];

    const rules: Rule[] = folders.map((folder) =>
      createFolderWithIndex(`${root ?? `${sourceRoot}/${prefix}`}/${folder}`),
    );

    return chain([...rules, addToShortImport(folders)]);
  };
}

function createFolderWithIndex(path: string): Rule {
  return () => {
    const urlTemplates = ['index.ts.template'];
    const template = apply(url('./files'), [
      filter((filePath) => urlTemplates.some((urlTemplate) => filePath.includes(urlTemplate))),
      applyTemplates({
        ...strings,
      }),
      renameTemplateFiles(),
      move(path),
    ]);

    return mergeWith(template, MergeStrategy.Overwrite);
  };
}

function addToShortImport(folders: string[]): Rule {
  return async (tree: Tree) => {
    const tsconfigPath = normalize('/tsconfig.json');
    if (!tree.exists(tsconfigPath)) {
      logAndThrow(`tsconfig.json not found at path: ${tsconfigPath}`);
    }

    let tsconfigContent = tree.readText(tsconfigPath);
    if (!tsconfigContent) {
      logAndThrow(`Failed to read tsconfig.json at path: ${tsconfigPath}`);
    }

    const workspace = await readWorkspace(tree);
    const projectName = getDefaultProjectName(workspace);
    const { sourceRoot, prefix } = getProject(workspace, projectName);

    tsconfigContent = folders.reduce((file, folder) => {
      return addShortImportToTsConfig(file, `@${folder}`, `./${sourceRoot}/${prefix}/${folder}/index.ts`);
    }, tsconfigContent);
    tree.overwrite(tsconfigPath, tsconfigContent);
  };
}

// Utility function for consistent error logging and throwing
function logAndThrow(message: string): never {
  console.error(message);
  throw new SchematicsException(message);
}
