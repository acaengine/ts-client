import { of, from, Observable } from 'rxjs'
import { concatMap, delay } from 'rxjs/operators'

import { EngineHttpClient } from '../http.service'
import { HashMap } from '../../utilities/types.utilities'
import { log, convertPairStringToMap } from '../../utilities/general.utilities'
import { MockHttpRequestHandler, MockHttpRequest } from './mock-http.interfaces'
import {
    HttpOptions,
    HttpResponse,
    HttpVerb,
    HttpJsonOptions,
    HttpTextOptions
} from '../http.interfaces'
import { EngineAuthService } from '../../auth/auth.service'

declare global {
    interface Window {
        control: {
            [name: string]: any
            handlers: MockHttpRequestHandler[]
        }
    }
}

export class MockEngineHttpClient extends EngineHttpClient {
    /** Mapping of handlers for http requests */
    private _handlers: HashMap<MockHttpRequestHandler> = {}

    constructor(protected _auth: EngineAuthService) {
        super(_auth)
        // Register global space mock request handlers
        if (window.control && window.control.handlers) {
            for (const handler of window.control.handlers) {
                this.register(handler.path, handler.metadata, handler.method, handler.callback)
            }
        }
    }

    /**
     * Register handler for http endpoint
     * @param path URL to be handled
     * @param data Data associated with the results of the endpoint
     * @param method HTTP Verb to listen to
     * @param callback Callback for handling request to the given endpoint
     */
    public register<T>(
        path: string,
        data: any,
        method: HttpVerb = 'GET',
        callback?: (handler: MockHttpRequest<T>) => T
    ) {
        const key = `${method}|${path}`
        if (this._handlers[key]) {
            delete this._handlers[key]
            log('HTTP(M)', `Removed old handler for ${method} ${path}`)
        }
        const path_parts = path
            .replace(/(http|https):\/\/[a-zA-Z0-9.]*:?([0-9]*)?/g, '') // Remove URL origin
            .replace(/^\//, '')
            .split('/')
        const handler: MockHttpRequestHandler<T> = {
            path,
            method,
            metadata: data,
            callback: callback || (a => a.metadata),
            path_parts,
            path_structure: path_parts.map(i => (i[0] === ':' ? i.replace(':', '') : ''))
        }
        this._handlers[key] = handler
    }

    public get(url: string, options?: HttpJsonOptions): Observable<HashMap>
    public get(url: string, options?: HttpTextOptions): Observable<string>
    public get(
        url: string,
        options: HttpOptions = { response_type: 'json' }
    ): Observable<HttpResponse> {
        const handler = this.findRequestHandler('GET', url)
        if (handler) {
            const request = this.processRequest(url, handler)
            return from([handler.callback(request)]).pipe(
                concatMap(item => of(item).pipe(delay(Math.floor(Math.random() * 300 + 50))))
            )
        }
        return super.get(url, options as any)
    }

    /**
     * Find a request handler for the given URL and method
     * @param method HTTP verb for the request
     * @param url URL of the request
     */
    private findRequestHandler(method: HttpVerb, url: string): MockHttpRequestHandler | null {
        const path = url.replace(/(http|https):\/\/[a-zA-Z0-9.]*:?([0-9]*)?/g, '').split('?')[0]
        const route_parts = path.split('/')
        const method_handlers: MockHttpRequestHandler[] = Object.keys(this._handlers).reduce<
            MockHttpRequestHandler[]
        >((l, i) => {
            i.indexOf(`${method}|`) === 0 ? l.push(this._handlers[i]) : ''
            return l
        }, [])
        for (const handler of method_handlers) {
            if (handler.path_structure.length === route_parts.length) {
                // Path lengths match
                let match = true
                for (let i = 0; i < handler.path_structure.length; i++) {
                    if (!handler.path_structure[i] && handler.path_parts[i] !== route_parts[i]) {
                        // Static path fragments don't match
                        match = false
                        break
                    }
                }
                if (match) {
                    return handler
                }
            }
        }
        return null
    }

    /**
     * Generate mock HTTP request from the given URL and handler
     * @param url URL to mock
     * @param handler Handler for the given URL
     */
    private processRequest<T = any>(
        url: string,
        handler: MockHttpRequestHandler<T>
    ): MockHttpRequest<T> {
        const parts = url.replace(/(http|https):\/\/[a-zA-Z0-9.]*:?([0-9]*)?/g, '').split('?')
        const path = parts[0]
        const query = parts[1] || ''
        const query_params = convertPairStringToMap(query)
        // Grab route parameters from URL
        const route_parts = path.split('/')
        const route_params: HashMap = {}
        for (const part of handler.path_structure) {
            if (part) {
                route_params[part] = route_parts[handler.path_structure.indexOf(part)]
            }
        }
        return {
            path: handler.path,
            method: handler.method,
            metadata: handler.metadata,
            route_params,
            query_params
        }
    }
}
