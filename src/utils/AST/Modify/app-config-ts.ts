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
  ImportClause,
  SyntaxKind,
} from 'typescript';
import { Tree, Rule } from '@angular-devkit/schematics';

export interface ProviderUpdateConfig {
  importPath: string;
  importValue: string | Record<string, boolean>; // String for default imports, object for named imports
  isDefault?: boolean; // Indicates whether it's a default import
  providerExpression: string;
  providerCondition: (providerText: string) => boolean;
}

/**
 * Utility to collect and merge imports, handling both default and named imports.
 */
export function collectImports(sourceFile: any, configs: ProviderUpdateConfig[]): Set<string> {
  const imports = new Map<string, { defaultImport?: string; namedImports: Set<string> }>();

  // Helper to process an import clause
  const processImportClause = (importClause: ImportClause, importPath: string) => {
    const namedImports = imports.get(importPath)?.namedImports || new Set<string>();
    let defaultImport = imports.get(importPath)?.defaultImport;

    // Check for default import
    if (importClause.name) {
      defaultImport = importClause.name.getText(); // Collect default import
    }

    // Check for named imports
    if (importClause.namedBindings && importClause.namedBindings.kind === SyntaxKind.NamedImports) {
      const elements = importClause.namedBindings.elements;
      elements.forEach((element) => namedImports.add(element.name.getText()));
    }

    imports.set(importPath, { defaultImport, namedImports });
  };

  // Collect existing imports
  forEachChild(sourceFile, (node) => {
    if (isImportDeclaration(node)) {
      const importPath = node.moduleSpecifier.getText().slice(1, -1); // Remove quotes
      if (node.importClause) {
        processImportClause(node.importClause, importPath);
      }
    }
  });

  // Process new imports
  configs.forEach(({ importPath, importValue, isDefault }) => {
    const entry = imports.get(importPath) || { namedImports: new Set<string>() };

    if (isDefault) {
      // Add or update default import
      if (typeof importValue === 'string') {
        entry.defaultImport = importValue;
      }
    } else if (typeof importValue === 'object') {
      // Add named imports from an object
      Object.keys(importValue).forEach((key) => entry.namedImports.add(key));
    } else if (typeof importValue === 'string') {
      // Add a single named import
      entry.namedImports.add(importValue);
    }

    imports.set(importPath, entry);
  });

  // Construct final import strings
  const result = new Set<string>();
  imports.forEach(({ defaultImport, namedImports }, path) => {
    const named = namedImports.size > 0 ? `{ ${[...namedImports].join(', ')} }` : '';
    const defaultPart = defaultImport ? `${defaultImport}` : '';
    const combined = defaultPart && named ? `${defaultPart}, ${named}` : defaultPart || named;
    result.add(`import ${combined} from '${path}';`);
  });

  return result;
}

/**
 * Utility to collect and deduplicate providers in the appConfig object.
 */
function collectProviders(sourceFile: any, configs: ProviderUpdateConfig[]): Set<string> {
  const providers = new Set<string>();

  // Traverse AST to find and process the `providers` array in `appConfig`
  forEachChild(sourceFile, (node) => {
    if (isVariableStatement(node)) {
      const declarationList = node.declarationList.declarations;

      for (const declaration of declarationList) {
        if (
          isVariableDeclaration(declaration) &&
          declaration.name.getText(sourceFile) === 'appConfig' &&
          declaration.initializer &&
          isObjectLiteralExpression(declaration.initializer) &&
          declaration.initializer.properties
        ) {
          const providersProperty = declaration.initializer.properties.find(
            (p) => isPropertyAssignment(p) && p.name.getText(sourceFile) === 'providers',
          );

          if (providersProperty && isPropertyAssignment(providersProperty)) {
            const arrayLiteral = providersProperty.initializer;

            if (isArrayLiteralExpression(arrayLiteral)) {
              arrayLiteral.elements.forEach((element) => {
                const providerText = element.getFullText(sourceFile).trim();
                providers.add(providerText); // Collect existing providers
              });

              // Add new providers if not already present
              configs.forEach(({ providerExpression }) => {
                if (![...providers].some((existingProvider) => existingProvider === providerExpression.trim())) {
                  providers.add(providerExpression);
                }
              });
            }
          }
        }
      }
    }
  });

  return providers;
}

/**
 * Core function to update appConfig with specified provider configurations.
 */
export function updateAppConfigWithProviders(filePath: string, configs: ProviderUpdateConfig[]): Rule {
  return (tree: Tree) => {
    if (!tree.exists(filePath)) {
      throw new Error(`The file at path ${filePath} does not exist.`);
    }

    const fileContent = tree.read(filePath)?.toString('utf-8');
    if (!fileContent) {
      throw new Error(`Could not read the file at path ${filePath}.`);
    }

    const sourceFile = createSourceFile(filePath, fileContent, ScriptTarget.Latest, true);

    // Collect imports and providers
    const imports = collectImports(sourceFile, configs);
    const providers = collectProviders(sourceFile, configs);

    // Construct the updated file content
    const updatedFileContent = `
${Array.from(imports).join('\n')}

export const appConfig: ApplicationConfig = {
  providers: [${Array.from(providers).join(', ')}],
};
    `.trim();

    tree.overwrite(filePath, updatedFileContent);
    return tree;
  };
}

/**
 * Replaces a provider and its associated import in the appConfig file.
 */
export function replaceProviderAndImport(
  filePath: string,
  oldProvider: string,
  newProvider: string,
  importPath: string,
): Rule {
  return (tree: Tree) => {
    if (!tree.exists(filePath)) {
      throw new Error(`The file at path ${filePath} does not exist.`);
    }

    const fileContent = tree.read(filePath)?.toString('utf-8');
    if (!fileContent) {
      throw new Error(`Could not read the file at path ${filePath}.`);
    }

    const sourceFile = createSourceFile(filePath, fileContent, ScriptTarget.Latest, true);

    const imports = new Map<string, { defaultImport?: string; namedImports: Set<string> }>();
    const providers = new Set<string>();

    // Helper to process an import clause
    const processImportClause = (importClause: ImportClause, importPath: string) => {
      const namedImports = imports.get(importPath)?.namedImports || new Set<string>();
      let defaultImport = imports.get(importPath)?.defaultImport;

      if (importClause.name) {
        defaultImport = importClause.name.getText(); // Collect default import
      }

      if (importClause.namedBindings && importClause.namedBindings.kind === SyntaxKind.NamedImports) {
        const elements = importClause.namedBindings.elements;
        elements.forEach((element) => namedImports.add(element.name.getText()));
      }

      imports.set(importPath, { defaultImport, namedImports });
    };

    // Collect existing imports
    forEachChild(sourceFile, (node) => {
      if (isImportDeclaration(node)) {
        const modulePath = node.moduleSpecifier.getText().slice(1, -1); // Remove quotes
        if (node.importClause) {
          processImportClause(node.importClause, modulePath);
        }
      }
    });

    // Collect and modify providers
    forEachChild(sourceFile, (node) => {
      if (isVariableStatement(node)) {
        const declarationList = node.declarationList.declarations;

        for (const declaration of declarationList) {
          if (
            isVariableDeclaration(declaration) &&
            declaration.name.getText(sourceFile) === 'appConfig' &&
            declaration.initializer &&
            isObjectLiteralExpression(declaration.initializer) &&
            declaration.initializer.properties
          ) {
            const providersProperty = declaration.initializer.properties.find(
              (p) => isPropertyAssignment(p) && p.name.getText(sourceFile) === 'providers',
            );

            if (providersProperty && isPropertyAssignment(providersProperty)) {
              const arrayLiteral = providersProperty.initializer;

              if (isArrayLiteralExpression(arrayLiteral)) {
                arrayLiteral.elements.forEach((element) => {
                  const providerText = element.getFullText(sourceFile).trim();
                  if (providerText === oldProvider) {
                    providers.add(newProvider); // Replace the old provider
                  } else {
                    providers.add(providerText); // Preserve existing providers
                  }
                });
              }
            }
          }
        }
      }
    });

    // Update imports to replace the old named import
    if (imports.has(importPath)) {
      const entry = imports.get(importPath)!;

      // Remove old named import
      entry.namedImports.delete(oldProvider.replace(/\(.*\)/, '').trim());

      // Add new named import
      entry.namedImports.add(newProvider.replace(/\(.*\)/, '').trim());

      // Remove the entire import if it's now empty
      if (entry.namedImports.size === 0 && !entry.defaultImport) {
        imports.delete(importPath);
      } else {
        imports.set(importPath, entry);
      }
    } else {
      // If the importPath doesn't exist, add it
      imports.set(importPath, {
        namedImports: new Set([newProvider.replace(/\(.*\)/, '').trim()]),
      });
    }

    // Construct the updated imports
    const updatedImports = new Set<string>();
    imports.forEach(({ defaultImport, namedImports }, path) => {
      const named = namedImports.size > 0 ? `{ ${[...namedImports].join(', ')} }` : '';
      const defaultPart = defaultImport ? `${defaultImport}` : '';
      const combined = defaultPart && named ? `${defaultPart}, ${named}` : defaultPart || named;
      updatedImports.add(`import ${combined} from '${path}';`);
    });

    // Construct the updated file content
    const updatedFileContent = `
${Array.from(updatedImports).join('\n')}

export const appConfig: ApplicationConfig = {
  providers: [${Array.from(providers).join(', ')}],
};
    `.trim();

    tree.overwrite(filePath, updatedFileContent);
    return tree;
  };
}
