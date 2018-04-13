//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
//import {toStr} from '/lib/enonic/util';
import {base64UrlDecode} from '/lib/text-encoding';
import {readText} from '/lib/xp/io';

//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function decodeAccessToken(accessToken) {
    const jwtParts = accessToken.split('.').map((base64url) => {
        //log.info(`base64url:${toStr(base64url)}`);
        const stream = base64UrlDecode(base64url);
        const decoded = readText(stream);
        //log.info(`decoded:${toStr(decoded)}`);
        return decoded;
    });
    //log.info(`jwtParts:${toStr(jwtParts)}`);
    const jwt = {
        header: JSON.parse(jwtParts[0]),
        payload: JSON.parse(jwtParts[1]),
        signature: jwtParts[2]
    };
    //log.info(`jwt:${toStr(jwt)}`);
    return jwt;
} // function decodeAccessToken
