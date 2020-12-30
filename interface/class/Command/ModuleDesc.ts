interface ModuleObject {
    modulePath: string,
    dependency: Array<string>
}

export interface ModuleDesc {
    module: Record<string, ModuleObject>
}