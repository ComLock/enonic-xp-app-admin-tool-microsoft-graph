//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {request as httpClientRequest} from '/lib/http-client';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {decodeAccessToken} from '../../lib/microsoftGraph/util/decodeAccessToken.es';
import {deepen} from '../../lib/microsoftGraph/util/deepen.es';
import {sortObject} from '../../lib/microsoftGraph/util/sortObject.es';
import {toStr} from '../../lib/microsoftGraph/util/toStr.es';

//──────────────────────────────────────────────────────────────────────────────
// Constants
//──────────────────────────────────────────────────────────────────────────────
const RT_JSON = 'text/json; charset=utf-8';


function applyProxy(config, requestParams) {
    if (config.proxy) {
        const proxy = {};
        if (config.proxy.host) { proxy.host = config.proxy.host; }
        if (config.proxy.port) { proxy.port = config.proxy.port; }
        if (config.proxy.user) { proxy.user = config.proxy.user; }
        if (config.proxy.password) { proxy.password = config.proxy.password; }
        requestParams.proxy = proxy; // eslint-disable-line no-param-reassign
    }
}

//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    const {userStore} = request.params;
    if (!userStore) {
        return {
            body: {
                message: 'Url parameter userStore must be present!'
            },
            contentType: RT_JSON,
            status: 400 // Bad request
        };
    }
    const config = sortObject(deepen(app.config)[userStore]);
    const requestParams = {
        contentType: 'application/json; charset=utf-8',
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
        contentType: RT_JSON
    };*/
} // export function get
