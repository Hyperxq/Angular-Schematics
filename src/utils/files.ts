import { singular, plural } from 'pluralize';
import {
  MergeStrategy,
  Rule,
  apply,
  applyTemplates,
  filter,
  mergeWith,
  move,
  renameTemplateFiles,
  strings,
  url,
} from '@angular-devkit/schematics';

export function addFilesToTree(
  options: { [key: string]: any },
  urlToMove: string,
  urlTemplates: string[],
  urlFiles = './files/ts',
): Rule {
  const template = apply(url(urlFiles), [
    filter((path) => urlTemplates.some((template) => path.endsWith(template))),
    applyTemplates({
      ...strings,
      ...options,
      singular,
      plural,
      lowercased: (name: string) => {
        const classifiedName = strings.classify(name);

        return classifiedName.charAt(0).toLowerCase() + classifiedName.slice(1);
      },
      ent: (name: string) => name + '.entity',
    }),
    renameTemplateFiles(),
    move(urlToMove),
  ]);

  return mergeWith(template, MergeStrategy.AllowCreationConflict);
}
