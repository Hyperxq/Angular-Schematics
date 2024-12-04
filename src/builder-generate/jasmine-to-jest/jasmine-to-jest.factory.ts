import { chain, noop, Rule } from '@angular-devkit/schematics';
import {
  addFilesToTree,
  addScriptToPackageJson,
  askConfirmation,
  executePackageCommand,
  installAsDevCommands,
  lockFile,
  spawnAsync,
  uninstallCommands,
} from '../../utils';
import { getDefaultProjectName, getProject, updateWorkspace } from '../../utils/Angular';

export function jasmineToJestFactory({ packageManager }: { packageManager: string }): Rule {
  return async () => {
    await spawnAsync(
      packageManager,
      [installAsDevCommands[packageManager], `jest @types/jest @jest/globals jest-preset-angular`],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      },
    );

    await spawnAsync(
      packageManager,
      [
        uninstallCommands[packageManager],
        `@types/jasmine jasmine-core karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter`,
      ],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
      },
    );

    const executeTestMigration = await askConfirmation('Would you like to migrate your existing tests?', false);

    return chain([
      replaceTsconfigSpec(),
      addJestConfig(),
      updateAngularJson(),
      addScriptToPackageJson('test', 'jest'),
      addScriptToPackageJson('test:coverage', 'jest --coverage'),
      executeTestMigration ? migrateTests(packageManager) : noop(),
    ]);
  };
}

function migrateTests(packageManager: string): Rule {
  return async () => {
    await spawnAsync(`git add ${lockFile[packageManager]} package.json`, [], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });
    await spawnAsync(`git commit -m "chore: migrate to from jasmine to jest dependencies"`, [], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

    console.info(
      `The migration will be executed using the command: ${executePackageCommand[packageManager]} jest-codemods`,
    );
    await spawnAsync(executePackageCommand[packageManager], [`jest-codemods`], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });
  };
}

function updateAngularJson(): Rule {
  return updateWorkspace((workspace) => {
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
    return addFilesToTree({}, `./`, ['tsconfig.spec.json.template'], './files');
  };
}

function addJestConfig(): Rule {
  return () => {
    return addFilesToTree({}, `./`, ['setup-jest.ts.template', 'jest.config.js.template'], './files');
  };
}
