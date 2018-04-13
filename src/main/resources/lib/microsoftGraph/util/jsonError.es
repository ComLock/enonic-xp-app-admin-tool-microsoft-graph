import {CT_JSON} from '../contentType.es';


export function jsonError(
    message = '',
    status = 400 // Bad request
) {
    return {
        body: {
            message
        },
        contentType: CT_JSON,
        status
    };
}
