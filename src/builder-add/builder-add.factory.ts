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
import {
  ProviderUpdateConfig,
  replaceProviderAndImport,
  updateAppConfigWithProviders,
} from '../utils/AST/Modify/app-config-ts';

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
      rules.push(updateZoneChangeDetection(configPath));
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
        schematicCollections: [newCollection, '@schematics/angular'],
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
  const configs: ProviderUpdateConfig[] = [
    {
      importPath: '@angular/common/http',
      importValue: { provideHttpClient: true, withFetch: true },
      providerExpression: `provideHttpClient(withFetch())`,
      providerCondition: (providerText) => providerText.includes('provideHttpClient'),
    },
    {
      importPath: '@angular/router',
      importValue: { provideRouter: true, withComponentInputBinding: true },
      providerExpression: `provideRouter(routes, withComponentInputBinding())`,
      providerCondition: (providerText) => providerText.includes('provideRouter'),
    },
  ];

  return updateAppConfigWithProviders(filePath, configs);
}

export function updateZoneChangeDetection(filePath: string): Rule {
  return replaceProviderAndImport(
    filePath,
    `provideZoneChangeDetection({ eventCoalescing: true })`,
    `provideExperimentalZonelessChangeDetection()`,
    '@angular/core',
  );
}
