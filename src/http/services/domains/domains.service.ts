import { HashMap } from '../../../utilities/types.utilities'
import { EngineHttpClient } from '../../http.service'
import { EngineResourceService } from '../resources/resources.service'
import { EngineDomain } from './domain.class'
import { IEngineDomainQuery } from './domain.interfaces'

export class EngineDomainsService extends EngineResourceService<EngineDomain> {
    constructor(protected http: EngineHttpClient) {
        super(http)
        this._name = 'Domain'
        this._api_route = 'domains'
    }

    /**
     * Query the index of the API route associated with this service
     * @param query_params Map of query paramaters to add to the request URL
     */
    public query(query_params?: IEngineDomainQuery) {
        return super.query(query_params)
    }

    /**
     * Convert API data into local interface
     * @param item Raw API data
     */
    protected process(item: HashMap) {
        return new EngineDomain(this, item)
    }
}
