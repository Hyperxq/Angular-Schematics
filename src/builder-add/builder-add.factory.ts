/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { chain, Rule, Tree } from '@angular-devkit/schematics';
import { getDefaultProjectName, getProject, readWorkspace, updateWorkspace } from '../utils/Angular';
import { spawnAsync } from '../utils';
import {
  createSourceFile,
  ScriptTarget,
  forEachChild,
  isImportDeclaration,
  isVariableStatement,
  isVariableDeclaration,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isArrayLiteralExpression,
  isCallExpression,
} from 'typescript';
import { normalize } from '@angular-devkit/core';
import { join } from 'path';

export function builderAddFactory({ skipNgrx }: { skipNgrx: boolean }): Rule {
  return async (tree: Tree) => {
    if (!skipNgrx) {
      await spawnAsync('ng', ['add', '@ngrx/signals@latest --skip-confirmation'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      });
    }

    const rules = [addCliConfig()];
    const workspace = await readWorkspace(tree);
    const projectName = getDefaultProjectName(workspace);
    const { sourceRoot, prefix } = getProject(workspace, projectName);
    const configPath = normalize(join(sourceRoot, prefix, 'app.config.ts'));

    if (tree.exists(configPath)) {
      rules.push(updateAppConfig(configPath));
    }

    return chain(rules);
  };
}

export function addCliConfig(): Rule {
  return updateWorkspace((workspace) => {
    const newCollection = '@pbuilder/angular';

    // Check if the `cli` property exists in the root of the workspace
    if (!workspace.extensions.cli) {
      // Add the `cli` configuration
      workspace.extensions.cli = {
        schematicCollections: [newCollection, '@schematics/angular']
      };
      console.log(`Added 'cli' configuration to the workspace`);
    } else {
      // If the `cli` property exists, add the collection at the beginning of the array
      const cliConfig = workspace.extensions.cli as { schematicCollections: string[] };

      if (Array.isArray(cliConfig.schematicCollections)) {
        // Use a Set to ensure uniqueness and add the new collection
        const uniqueCollections = new Set([...cliConfig.schematicCollections, newCollection]);
        cliConfig.schematicCollections = Array.from(uniqueCollections);
        console.log(`Updated 'schematicCollections' with '${newCollection}'`);
      } else {
        // If schematicCollections is not an array, initialize it properly
        cliConfig.schematicCollections = [newCollection];
        console.log(`Initialized 'schematicCollections' with '${newCollection}'`);
      }
    }
  });
}

function updateAppConfig(filePath: string): Rule {
  return (tree: Tree) => {
    if (!tree.exists(filePath)) {
      throw new Error(`The file at path ${filePath} does not exist.`);
    }

    const fileContent = tree.read(filePath)?.toString('utf-8');
    if (!fileContent) {
      throw new Error(`Could not read the file at path ${filePath}.`);
    }

    // Parse the file into an AST
    const sourceFile = createSourceFile(filePath, fileContent, ScriptTarget.Latest, true);

    // Collect required imports and appConfig updates
    const importsToAdd = new Set<string>();
    const updatedProviders = new Set<string>();

    forEachChild(sourceFile, (node) => {
      // Process import declarations
      if (isImportDeclaration(node)) {
        const importText = node.getText(sourceFile);
        if (!importText.includes('provideHttpClient') && importText.includes('@angular/common/http')) {
          importsToAdd.add(`import { provideHttpClient, withFetch } from '@angular/common/http';`);
        } else if (!importText.includes('withComponentInputBinding') && importText.includes('@angular/router')) {
          importsToAdd.add(`import { provideRouter, withComponentInputBinding } from '@angular/router';`);
        } else {
          importsToAdd.add(importText);
        }

        importsToAdd.add(`import { provideHttpClient, withFetch } from '@angular/common/http';`)
      }

      // Process appConfig object
      if (isVariableStatement(node)) {
        const declarationList = node.declarationList.declarations;

        for (const declaration of declarationList) {
          if (isVariableDeclaration(declaration) && declaration.name.getText(sourceFile) === 'appConfig') {
            if (
              declaration.initializer &&
              isObjectLiteralExpression(declaration.initializer) &&
              declaration.initializer.properties
            ) {
              const providersProperty = declaration.initializer.properties.find(
                (p) => isPropertyAssignment(p) && p.name.getText(sourceFile) === 'providers'
              );

              if (providersProperty && isPropertyAssignment(providersProperty)) {
                const arrayLiteral = providersProperty.initializer;

                if (isArrayLiteralExpression(arrayLiteral)) {
                  // Process existing providers
                  arrayLiteral.elements.forEach((element) => {
                    const providerText = element.getFullText(sourceFile).trim();
                    if (providerText.startsWith('provideRouter')) {
                      // Update provideRouter with an additional parameter
                      updatedProviders.add(`provideRouter(routes, withComponentInputBinding())`);
                    } else {
                      updatedProviders.add(providerText);
                    }
                  });

                  // Add new providers
                  updatedProviders.add(`provideHttpClient(withFetch())`);
                }
              }
            }
          }
        }
      }
    });

    // Construct the updated file content
    const updatedFileContent = `
${Array.from(importsToAdd).join('\n')}

export const appConfig: ApplicationConfig = {
  providers: [${Array.from(updatedProviders).join(', ')}],
};
    `.trim();

    // Write the updated content back to the file
    tree.overwrite(filePath, updatedFileContent);
    return tree;
  };
}
