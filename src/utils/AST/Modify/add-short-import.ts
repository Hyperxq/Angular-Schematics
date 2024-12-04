import { parse, stringify } from "comment-json";

/**
 * Behavior options for handling existing paths.
 */
type ExistingPathBehavior = 'update' | 'skip' | 'merge';


interface TsConfig {
  compilerOptions?: {
    paths?: { [key: string]: string[] };
  };
}

/**
 * Adds or updates a short import path in the given tsconfig content.
 *
 * @param {string} tsconfigContent - The content of the tsconfig.json file as a string.
 * @param {string} pathAlias - The alias to be added (e.g., "@app/*").
 * @param {string} pathValue - The corresponding path value (e.g., "src/*").
 * @param {ExistingPathBehavior} behavior - The behavior when the path alias already exists ("update", "skip", or "merge").
 * @returns {string} - The updated tsconfig content as a JSON string.
 */
export function addShortImportToTsConfig(
  tsconfigContent: string,
  pathAlias: string,
  pathValue: string,
  behavior: ExistingPathBehavior = 'update',
): string {
  let tsconfig;

  // Parse the tsconfig content
  try {
    tsconfig = parse(tsconfigContent) as TsConfig;
  } catch (error) {
    throw new Error(`Failed to parse tsconfig content: ${error}`);
  }

  // Ensure compilerOptions exists
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  // Ensure paths exists within compilerOptions
  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
  }

  // Handle existing path behavior
  const existingPath = tsconfig.compilerOptions.paths[pathAlias];

  if (existingPath) {
    switch (behavior) {
      case 'skip':
        // If skipping, just return the original content
        console.log(`Path alias "${pathAlias}" already exists. Skipping update.`);

        return tsconfigContent;

      case 'update':
        // Update the existing path alias to the new path value
        console.log(`Path alias "${pathAlias}" already exists. Updating to new path: "${pathValue}".`);
        tsconfig.compilerOptions.paths[pathAlias] = [pathValue];
        break;

      case 'merge':
        // Merge the new path value with existing values, avoiding duplicates
        console.log(`Path alias "${pathAlias}" already exists. Merging with existing paths.`);
        tsconfig.compilerOptions.paths[pathAlias] = Array.from(new Set([...existingPath, pathValue]));
        break;
    }
  } else {
    // If the path alias does not exist, add it
    tsconfig.compilerOptions.paths[pathAlias] = [pathValue];
  }

  // Return the updated tsconfig content as a formatted JSON string
  return stringify(tsconfig, null, 2);;
}
