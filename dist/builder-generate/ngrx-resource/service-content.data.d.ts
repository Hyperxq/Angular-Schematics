declare const serviceContent: (serviceName: string, url: string) => string;
declare const fullServiceContent: (imports: Set<string>, decorator: string, classHeader: string, classBody: string) => string;

export { fullServiceContent, serviceContent };
