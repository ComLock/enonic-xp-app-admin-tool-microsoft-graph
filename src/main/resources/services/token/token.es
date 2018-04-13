//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {request as httpClientRequest} from '/lib/http-client';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {CT_JSON} from '../../lib/microsoftGraph/contentType.es';

import {applyProxy} from '../../lib/microsoftGraph/util/applyProxy.es';
import {decodeAccessToken} from '../../lib/microsoftGraph/util/decodeAccessToken.es';
import {deepen} from '../../lib/microsoftGraph/util/deepen.es';
import {jsonError} from '../../lib/microsoftGraph/util/jsonError.es';
import {sortObject} from '../../lib/microsoftGraph/util/sortObject.es';
import {toStr} from '../../lib/microsoftGraph/util/toStr.es';


//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    const {userStore} = request.params;
    if (!userStore) {
        return jsonError('Url parameter userStore must be present!');
    }
    const config = sortObject(deepen(app.config)[userStore]);
    const requestParams = {
        contentType: CT_JSON,
        method: 'POST',
        params: {
            client_id: config.client.id,
            client_secret: config.client.secret,
            grant_type: 'client_credentials',
            scope: config.scope
        },
        url: config.tokenUrl
    };
    applyProxy(config, requestParams);
    log.debug(toStr({requestParams}));

    const tokenResponse = httpClientRequest(requestParams);
    log.debug(toStr({tokenResponse}));

    const obj = JSON.parse(tokenResponse.body);
    tokenResponse.body = obj;
    const jwt = decodeAccessToken(obj.access_token); // log.info(`jwt:${toStr(jwt)}`);
    tokenResponse.body.jwt = {
        //header: jwt.header,
        payload: jwt.payload
        //signature: jwt.signature // Signature has binary chars not good for logging.
    };
    log.debug(toStr({tokenResponse}));

    return tokenResponse;

    /*return {
        body: {
            userStore,
            config,
            requestParams,
            tokenResponse
        },
        contentType: CT_JSON
    };*/
} // export function get
