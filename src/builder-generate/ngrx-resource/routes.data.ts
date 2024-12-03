import { strings } from '@angular-devkit/core';
import { plural, singular } from 'pluralize';
export const routesToAdd = (resourceName: string) => [
  `{
    path: '${plural(strings.camelize(resourceName))}',
    loadComponent: () =>
      import('./${plural(strings.camelize(resourceName))}/${plural(strings.camelize(resourceName))}.component').then((m) => m.${singular(strings.classify(resourceName))}sComponent),
  }`,
  `{
    path: '${plural(strings.camelize(resourceName))}/:id',
    loadComponent: () =>
      import('./${plural(strings.camelize(resourceName))}/components/${singular(strings.camelize(resourceName))}/${singular(strings.camelize(resourceName))}.component').then((m) => m.${singular(strings.classify(resourceName))}Component),
  }`,
  `{
    path: '${plural(strings.camelize(resourceName))}/add/:id',
    loadComponent: () =>
      import('./${plural(strings.camelize(resourceName))}/components/${singular(strings.camelize(resourceName))}-edit/${singular(strings.camelize(resourceName))}-edit.component').then((m) => m.${singular(strings.classify(resourceName))}EditComponent),
  }`,
  `{
    path: '${plural(strings.camelize(resourceName))}/update/:id',
    loadComponent: () =>
      import('./${plural(strings.camelize(resourceName))}/components/${singular(strings.camelize(resourceName))}-update/${singular(strings.camelize(resourceName))}-update.component').then((m) => m.${singular(strings.classify(resourceName))}UpdateComponent),
  }`,
];