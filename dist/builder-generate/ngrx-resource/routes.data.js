'use strict';

var core = require('@angular-devkit/core');
var pluralize = require('pluralize');

const routesToAdd = (resourceName)=>[
        `{
    path: '${pluralize.plural(core.strings.camelize(resourceName))}',
    loadComponent: () =>
      import('./${pluralize.plural(core.strings.camelize(resourceName))}/${pluralize.plural(core.strings.camelize(resourceName))}.component').then((m) => m.${pluralize.singular(core.strings.classify(resourceName))}sComponent),
  }`,
        `{
    path: '${pluralize.plural(core.strings.camelize(resourceName))}/:id',
    loadComponent: () =>
      import('./${pluralize.plural(core.strings.camelize(resourceName))}/components/${pluralize.singular(core.strings.camelize(resourceName))}/${pluralize.singular(core.strings.camelize(resourceName))}.component').then((m) => m.${pluralize.singular(core.strings.classify(resourceName))}Component),
  }`,
        `{
    path: '${pluralize.plural(core.strings.camelize(resourceName))}/add/:id',
    loadComponent: () =>
      import('./${pluralize.plural(core.strings.camelize(resourceName))}/components/${pluralize.singular(core.strings.camelize(resourceName))}-edit/${pluralize.singular(core.strings.camelize(resourceName))}-edit.component').then((m) => m.${pluralize.singular(core.strings.classify(resourceName))}EditComponent),
  }`,
        `{
    path: '${pluralize.plural(core.strings.camelize(resourceName))}/update/:id',
    loadComponent: () =>
      import('./${pluralize.plural(core.strings.camelize(resourceName))}/components/${pluralize.singular(core.strings.camelize(resourceName))}-update/${pluralize.singular(core.strings.camelize(resourceName))}-update.component').then((m) => m.${pluralize.singular(core.strings.classify(resourceName))}UpdateComponent),
  }`
    ];

exports.routesToAdd = routesToAdd;
