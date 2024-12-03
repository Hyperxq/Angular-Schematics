import { normalize } from '@angular-devkit/core';
import { apply, applyTemplates, chain, filter, MergeStrategy, mergeWith, move, renameTemplateFiles, Rule, SchematicContext, SchematicsException, strings, Tree, url } from '@angular-devkit/schematics';
import { addFilesToTree, addShortImportToTsConfig } from '../../utils';

export function scaffoldingFactory({ root = 'src/app' }: { root: string }): Rule {
  return () => {
    const folders = [
      'adapters',
      'components',
      'models',
      'pipes',
      'services',
      'stores',
    ];

    const rules: Rule[] = folders.map((folder) => createFolderWithIndex(`${root}/${folder}`));

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
  return (tree: Tree) => {
    const tsconfigPath = normalize('/tsconfig.json');
    if (!tree.exists(tsconfigPath)) {
      logAndThrow(`tsconfig.json not found at path: ${tsconfigPath}`);
    }

    let tsconfigContent = tree.readText(tsconfigPath);
    if (!tsconfigContent) {
      logAndThrow(`Failed to read tsconfig.json at path: ${tsconfigPath}`);
    }

    tsconfigContent = folders.reduce((file, folder) => {
      return addShortImportToTsConfig(file, `@${folder}`, `./src/app/${folder}/index.ts`);
    }, tsconfigContent);
    tree.overwrite(tsconfigPath, tsconfigContent);
  }
}

// Utility function for consistent error logging and throwing
function logAndThrow(message: string): never {
  console.error(message);
  throw new SchematicsException(message);
}
