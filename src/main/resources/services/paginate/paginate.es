//──────────────────────────────────────────────────────────────────────────────
// Node modules (resolved and bundled by webpack)
//──────────────────────────────────────────────────────────────────────────────
//import URI from 'uri-parse';
import Urijs from 'urijs';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {get as graphRequest} from '../graph/graph.es';

import {CT_JSON} from '../../lib/microsoftGraph/contentType.es';

import {toStr} from '../../lib/microsoftGraph/util/toStr.es';

//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    //log.info(`service/paginate.get() request:${toStr(request)}`);
    if (!request.params.top) { request.params.top = 999; }
    const graphResponses = [];
    let pageNo = 0;
    let more = true;
    while (more) {
        try {
            pageNo += 1;
            //log.info(`Before pageNo:${pageNo} request:${toStr(request)}`);
            //log.info('service/paginate.get() before graphRequest');
            const graphResponse = graphRequest(request);
            //log.info('service/paginate.get() after graphRequest');
            //log.info(toStr({graphResponse, pageNo})); // DEBUG
            graphResponses.push(graphResponse);
            if (graphResponse.body['@odata.nextLink']) {
                //log.info(`@odata.nextLink: ${graphResponse.body['@odata.nextLink']}`);
                const urijs = new Urijs(graphResponse.body['@odata.nextLink']).normalizeQuery(); //log.info(`urijs:${toStr(urijs)}`);
                const skiptoken = urijs.search(true).$skiptoken; //log.info(`skiptoken:${skiptoken}`);

                /*const uri = new URI(graphResponse.body['@odata.nextLink']); //log.info(`uri:${toStr(uri)}`);
                const {query} = uri.all();
                //log.info(toStr({query}));
                const skiptoken = query.$skiptoken; log.info(`skiptoken:${skiptoken}`);*/

                request.params.skiptoken = skiptoken; log.info(`skiptoken:${skiptoken}`);
                //log.info(`Modified pageNo:${pageNo} request:${toStr(request)}`);
            } else {
                more = false;
            }
        } catch (e) {
            log.error(`Seomthing went wrong on pageNo:${pageNo} request:${toStr(request)}`);
            log.error(e);
        }
    } // while more
    return {
        body: {graphResponses},
        contentType: CT_JSON
    };
} // export function get(request)
