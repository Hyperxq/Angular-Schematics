'use strict';

var core = require('@angular-devkit/core');
var pluralize = require('pluralize');

const serviceContent = (serviceName, url)=>{
    const serviceNamePlural = pluralize.plural(serviceName);
    const serviceNameSingular = pluralize.singular(serviceName);
    return `private readonly baseUrl = "${url}";
  http = inject(HttpClient);

  getAll${core.strings.classify(serviceNamePlural)}(): Observable<${core.strings.classify(serviceNameSingular)}[]> {
    return this.http.get<${core.strings.classify(serviceNameSingular)}[]>(this.baseUrl).pipe(map(data => ${core.strings.classify(serviceNameSingular)}Adapter(data)));
  }

  add${pluralize.singular(core.strings.classify(serviceNameSingular))}(${core.strings.dasherize(serviceNameSingular)}: Create${core.strings.classify(serviceNameSingular)}): Observable<void> {
    return this.http.post<void>(this.baseUrl, { ${core.strings.dasherize(serviceNameSingular)} }).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }

  remove${pluralize.singular(core.strings.classify(serviceNameSingular))}(id: number): Observable<void> {
    const url = \`\${this.baseUrl}/\${id}\`;
    return this.http.delete<void>(url).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }

  update${pluralize.singular(core.strings.classify(serviceNameSingular))}(${core.strings.dasherize(serviceNameSingular)}: Update${core.strings.classify(serviceNameSingular)}): Observable<void> {
    return this.http.put<void>(this.baseUrl, { ${core.strings.dasherize(serviceNameSingular)} }).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }
`;
};
const fullServiceContent = (imports, decorator, classHeader, classBody)=>{
    return `
${Array.from(imports).join('\n')}

${decorator}
${classHeader} {
${classBody}
}
    `;
};

exports.fullServiceContent = fullServiceContent;
exports.serviceContent = serviceContent;
