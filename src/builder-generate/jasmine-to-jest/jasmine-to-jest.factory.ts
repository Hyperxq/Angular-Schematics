import { workspaces } from '@angular-devkit/core';
import { chain, Rule, Tree } from '@angular-devkit/schematics';
import { addFilesToTree, installAsDevCommands, installCommands, spawnAsync, uninstallCommands } from '../../utils';
import { getDefaultProjectName, getProject, readWorkspace, updateWorkspace } from '../../utils/Angular';

export function jasmineToJestFactory({packageManager,} : {packageManager: string;}): Rule {
  return async () => {
    // * 1. Install jest deps
    await spawnAsync(
      packageManager,
      [installAsDevCommands[packageManager], `jest @types/jest @jest/globals jest-preset-angular`],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      },
    );
    // * 2. Uninstall jasmine deps
    await spawnAsync(
      packageManager,
      [uninstallCommands[packageManager], `@types/jasmine jasmine-core karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter`],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      },
    );
    // * 3. Replace tsconfig.spec.json
    // * 4. Add setup-jest.ts
    // * 5. Add jest.config.js
    // * 6. remove test worker


    return chain([replaceTsconfigSpec(), addJestConfig(), updateAngularJson()]);
  };
}

function updateAngularJson(): Rule {
  return  updateWorkspace((workspace) => {
    const projectName = getDefaultProjectName(workspace);
    const project = getProject(workspace, projectName);
    if (project.targets.has('test')) {
      project.targets.delete('test');
      console.log(`Removed 'test' target from project: ${projectName}`);
    }
  });
}

function replaceTsconfigSpec(): Rule {
  return () => {
    return addFilesToTree(
      {},
      `./`,
      ['tsconfig.spec.json.template'],
      './files',
    );
  };
}

function addJestConfig(): Rule {
  return () => {
    return addFilesToTree(
      {},
      `./`,
      ['setup-jest.ts.template', 'jest.config.js.template'],
      './files',
    );
  };
}