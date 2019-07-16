import { HashMap } from '../../../utilities/types.utilities'
import { EngineHttpClient } from '../../http.service'
import { EngineResourceService } from '../resources/resources.service'
import { EngineAuthSource } from './auth-source.class'
import { IEngineAuthSourceQuery } from './auth-source.interfaces'

export class EngineAuthSourcesService extends EngineResourceService<EngineAuthSource> {
    constructor(protected http: EngineHttpClient) {
        super(http)
        this._name = 'Authentication Source'
        this._api_route = 'authsources'
    }

    /**
     * Query the index of the API route associated with this service
     * @param query_params Map of query paramaters to add to the request URL
     */
    public query(query_params?: IEngineAuthSourceQuery) {
        return super.query(query_params)
    }

    /**
     * Convert API data into local interface
     * @param item Raw API data
     */
    protected process(item: HashMap) {
        return new EngineAuthSource(this, item)
    }
}
