//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {request as httpClientRequest} from '/lib/http-client';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {CT_JSON} from '../../lib/microsoftGraph/contentType.es';

import {applyProxy} from '../../lib/microsoftGraph/util/applyProxy.es';
import {deepen} from '../../lib/microsoftGraph/util/deepen.es';
import {jsonError} from '../../lib/microsoftGraph/util/jsonError.es';
import {sortObject} from '../../lib/microsoftGraph/util/sortObject.es';
import {toStr} from '../../lib/microsoftGraph/util/toStr.es';
import {get as getToken} from '../token/token.es';

//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    //log.info('service/graph.get()');
    const {
        body, resource, select, skiptoken, top, userStore
    } = request.params;
    let {authorization} = request.params;
    if (!resource) {
        return jsonError('Url parameter resource must be present!');
    }
    if (!userStore) {
        return jsonError('Url parameter userStore must be present!');
    }
    if (!authorization) {
        //log.info('service/graph.get() before getToken');
        const tokenResponse = getToken({params: { userStore }});
        //log.info('service/graph.get() after getToken');
        //log.debug(toStr({tokenResponse}));
        authorization = `${tokenResponse.body.token_type} ${tokenResponse.body.access_token}`;
    }
    const path = request.params.path || 'v1.0';
    const method = request.params.method || 'GET';
    const config = sortObject(deepen(app.config)[userStore]);
    const requestParams = {
        contentType: CT_JSON,
        headers: {
            Authorization: authorization
        },
        method,
        url: `${config.host}/${path}/${resource}`
    };
    if (select || skiptoken || top) {
        if (!requestParams.params) { requestParams.params = {}; }
        if (select) { requestParams.params.$select = select; }
        if (skiptoken) { requestParams.params.$skiptoken = skiptoken; }
        if (top) { requestParams.params.$top = top; }
    }
    if (body) { requestParams.body = body; }
    applyProxy(config, requestParams);
    //log.info(toStr({requestParams})); // DEBUG

    const graphResponse = httpClientRequest(requestParams);
    //log.info(toStr({graphResponse})); // DEBUG
    //throw new Error('DEBUG');

    const obj = JSON.parse(graphResponse.body);
    graphResponse.body = obj;
    log.debug(toStr({graphResponse}));

    return graphResponse;
} // export function get
