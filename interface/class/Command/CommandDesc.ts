interface CommandObject {
    moduleName: string
}

export interface CommandDesc {
    command: Record<string, CommandObject>
}