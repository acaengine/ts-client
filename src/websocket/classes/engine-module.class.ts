import { EngineBindingService } from '../binding.service'
import { EngineSystemBinding } from './engine-system.class'
import { HashMap } from '../../utilities/types.utilities'
import { EngineVariableBinding } from './engine-status-variable.class'

export class EngineModuleBinding {
    /** Module ID */
    readonly id: string
    /** Mapping of module bindings */
    private _bindings: HashMap<EngineVariableBinding> = {}

    constructor(
        private _service: EngineBindingService,
        private _system: EngineSystemBinding,
        _id: string
    ) {
        this.id = _id
    }

    /** Parent system of the module */
    public get system(): EngineSystemBinding {
        return this._system
    }

    /** Module index */
    public get index(): number {
        const parts = this.id.split('_')
        const index = parts.pop()
        return parseInt(index || '') || 1
    }

    /** Module name */
    public get name(): string {
        const parts = this.id.split('_')
        parts.pop()
        return parts.join('_')
    }

    /**
     * Get binding with the given name
     * @param name Name of the binding
     */
    public binding(name: string) {
        if (!this._bindings[name]) {
            this._bindings[name] = new EngineVariableBinding(this._service, this, name)
        }
        return this._bindings[name]
    }

    /**
     * Execute method on the engine module
     * @param method Name of the method
     * @param args Array of arguments to pass to the method
     */
    public exec(method: string, args?: any[]): Promise<any> {
        return this._service.engine.exec({
            sys: this._system.id,
            mod: this.name,
            index: this.index,
            name: method,
            args
        })
    }
}
