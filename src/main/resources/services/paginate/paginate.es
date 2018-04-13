//──────────────────────────────────────────────────────────────────────────────
// Node modules (resolved and bundled by webpack)
//──────────────────────────────────────────────────────────────────────────────
import URI from 'uri-parse';


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
    if (!request.params.top) { request.params.top = 999; }
    const graphResponses = [];
    let pageNo = 0;
    let more = true;
    while (more) {
        pageNo += 1;
        log.debug(toStr({request, pageNo}));
        const graphResponse = graphRequest(request);
        log.debug(toStr({graphResponse, pageNo}));
        graphResponses.push(graphResponse);
        if (graphResponse.body['@odata.nextLink']) {
            const uri = new URI(graphResponse.body['@odata.nextLink']); //log.info(toStr({uri}));
            request.params.skipToken = uri.query.$skiptoken;
        } else {
            more = false;
        }
    } // while more
    return {
        body: {graphResponses},
        contentType: CT_JSON
    };
} // export function get(request)
