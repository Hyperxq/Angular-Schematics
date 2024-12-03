import {
  branchAndMerge,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  Tree,
} from '@angular-devkit/schematics';
import { addFilesToTree, parseName } from '../../utils';
import { singular, plural } from 'pluralize';
import {
  getDefaultProjectName,
  getProject,
  getWorkspace,
  readWorkspace,
  updateRoutes,
  WorkspaceDefinition,
} from '../../utils/Angular';
import {
  createSourceFile,
  forEachChild,
  ScriptTarget,
  isClassDeclaration,
  isImportDeclaration,
  getDecorators,
} from 'typescript';
import { normalize, strings } from '@angular-devkit/core';
import { fullServiceContent, serviceContent } from './service-content.data';
import { join } from 'path';
import { routesToAdd } from './routes.data';

interface Collection {
  [schematicName: string]: Schematic;
}

type Schematic = Record<string, any>;

export function ngrxResourceFactory({ name: pluralPath }: { name: string }): Rule {
  return async (tree: Tree) => {
    const schematicsPreSettings = await readSchematicsPreSettings(tree);
    const { name } = parseName(pluralPath);
    return chain([createNgrxResource(schematicsPreSettings, pluralPath), updateRoutes('src/app/app.routes.ts', routesToAdd(name))]);
  };
}

export async function readSchematicsPreSettings(tree: Tree) {
  // Read the workspace configuration
  const workspace = await readWorkspace(tree);
  const projectName = getDefaultProjectName(workspace);
  const project = getProject(workspace, projectName);

  const result: Collection = {};
  Object.entries(project.extensions?.schematics ?? {}).forEach(([schematicName, settings]) => {
    const [collection, schematic] = schematicName.split(':');
    result[collection] = { [schematic]: settings };
  });

  return result;
}

function createNgrxResource(schematics: Collection, resourcePath: string, url = 'PLACEHOLDER'): Rule {
  return async (tree: Tree) => {
    const workspace: WorkspaceDefinition = await getWorkspace(tree);
    const projectName = getDefaultProjectName(workspace);
    const {sourceRoot, prefix} = getProject(workspace, projectName);
    
    const { name, path } = parseName(resourcePath);
    const pluralPath =  normalize(join(path, plural(name)));
    const fullPath = normalize(join(sourceRoot, prefix, pluralPath));

    // Generate the main component, with native schematic
    const angularCollection = schematics['@schematics/angular'] ?? {};

    const componentSchematic = angularCollection['component'] ?? {};
    const componentRule = externalSchematic('@schematics/angular', 'component', {
      name: `${pluralPath}`,
      project: projectName,
      ...componentSchematic,
    });
    // Generate sub-components,
    const subComponentsRules = [
      `${pluralPath}/components/${singular(name)}Edit`,
      `${pluralPath}/components/${singular(name)}Update`,
      `${pluralPath}/components/${singular(name)}`,
    ].map((c) =>
      externalSchematic('@schematics/angular', 'component', {
        name: c,
        project: projectName,
        ...componentSchematic,
      }),
    );
    // Generate models
    const modelsRules = addFilesToTree(
      {
        name,
      },
      `${fullPath}`,
      ['__name@plural@dasherize__.model.ts.template', 'index.ts.template'],
      './files',
    );

    // Generate services with the angular schematic,
    // Update the service with the changes,
    const serviceSchematic = angularCollection['service'] ?? {};
    const serviceFilePath =  normalize(join(fullPath, `services/${plural(name)}.service.ts`));
    const serviceRule = externalSchematic('@schematics/angular', 'service', {
      name: `${pluralPath}/services/${plural(name)}`,
      project: projectName,
      ...serviceSchematic,
    });
    // Generate store,
    const storeRules = addFilesToTree(
      { name },
      `${fullPath}`,
      ['__name@plural@dasherize__.store.ts.template', 'index.ts.template'],
      './files',
    );

    // Generate adapters

    const adapterRules = addFilesToTree(
      { name },
      `${fullPath}`,
      ['__name@plural@dasherize__.adapter.ts.template', 'index.ts.template'],
      './files',
    );

    return chain([
      branchAndMerge(
        chain([componentRule, serviceRule, storeRules, adapterRules, modelsRules, ...subComponentsRules]),
        MergeStrategy.Overwrite
      ),
      branchAndMerge(updateService(serviceFilePath, singular(name), url), MergeStrategy.Overwrite),
    ]);
  };
}

function updateService(servicePath: string, serviceName: string, url: string): Rule {
  return (tree: Tree) => {
    const fileExists = tree.exists(servicePath);
    if (!fileExists) {
      throw new Error(`The service file at path ${servicePath} does not exist.`);
    }

    const fileContent = tree.read(servicePath)?.toString('utf-8');
    if (!fileContent) {
      throw new Error(`Could not read the service file at path ${servicePath}.`);
    }

    // Parse the file into an AST
    const sourceFile = createSourceFile(servicePath, fileContent, ScriptTarget.Latest, true);

    // Sections to store extracted parts
    const imports = new Set<string>();
    let decorator = '';
    let classHeader = '';
    let classBody = '';

    // Traverse the AST to extract the sections
    forEachChild(sourceFile, (node) => {
      if (isImportDeclaration(node)) {
        // Extract import statements
        const importText = node.getFullText(sourceFile).trim();
        imports.add(importText);
      } else if (isClassDeclaration(node)) {
        // Extract decorators using getDecorators (for versions without decorators directly available)
        const decorators = getDecorators?.(node)?.map((d) => d.getText(sourceFile)) || [];
        decorator = decorators.join('\n');
        classHeader = `export class ${node.name?.getText(sourceFile) || ''}`;
        classBody = node.members.map((member) => member.getFullText(sourceFile).trim()).join('\n');
      }
    });

    if (!classHeader) {
      throw new Error(`No class declaration found in the file: ${servicePath}`);
    }

    // Ensure required imports are present
    const requiredImports = [
      `import { HttpClient } from '@angular/common/http';`,
      `import { inject } from '@angular/core';`,
      `import { Observable } from 'rxjs';`,
      `import { map, catchError } from 'rxjs/operators';`,
      `import { ${singular(strings.classify(serviceName))}, Update${singular(strings.classify(serviceName))}, Create${singular(strings.classify(serviceName))} } from '../models';`,
      `import { ${singular(strings.classify(serviceName))}Adapter } from '../adapters';`,
    ];
    requiredImports.forEach((imp) => imports.add(imp));

    // Generate new class body
    const newClassBody = serviceContent(serviceName, url);

    // Construct the updated file content
    const updatedFileContent = fullServiceContent(imports, decorator, classHeader, newClassBody).trim();

    // Overwrite the file with updated content
    tree.overwrite(servicePath, updatedFileContent);
    return tree;
  };
}

function updateAppConfig(): Rule {
  return () => {};
}

function updateAppRoutes(): Rule {
  return () => {};
}
