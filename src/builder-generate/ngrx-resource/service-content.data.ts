import { strings } from '@angular-devkit/core';
import { plural, singular } from 'pluralize';
export const serviceContent = (serviceName: string, url: string) => {
  const serviceNamePlural = plural(serviceName);
  const serviceNameSingular = singular(serviceName);
  return `private readonly baseUrl = "${url}";
  http = inject(HttpClient);

  getAll${strings.classify(serviceNamePlural)}(): Observable<${strings.classify(serviceNameSingular)}[]> {
    return this.http.get<${strings.classify(serviceNameSingular)}[]>(this.baseUrl).pipe(map(data => ${strings.classify(serviceNameSingular)}Adapter(data)));
  }

  add${singular(strings.classify(serviceNameSingular))}(${strings.dasherize(serviceNameSingular)}: Create${strings.classify(serviceNameSingular)}): Observable<void> {
    return this.http.post<void>(this.baseUrl, { ${strings.dasherize(serviceNameSingular)} }).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }

  remove${singular(strings.classify(serviceNameSingular))}(id: number): Observable<void> {
    const url = \`\${this.baseUrl}/\${id}\`;
    return this.http.delete<void>(url).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }

  update${singular(strings.classify(serviceNameSingular))}(${strings.dasherize(serviceNameSingular)}: Update${strings.classify(serviceNameSingular)}): Observable<void> {
    return this.http.put<void>(this.baseUrl, { ${strings.dasherize(serviceNameSingular)} }).pipe(
      catchError(() => {
        console.info("error prevented for testing");
        return Promise.resolve();
      })
    );
  }
`
}

export const fullServiceContent = (imports: Set<string>,  decorator: string, classHeader: string, classBody: string) => { 
  return `
${Array.from(imports).join('\n')}

${decorator}
${classHeader} {
${classBody}
}
    `;
}