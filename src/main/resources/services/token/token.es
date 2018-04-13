const RT_JSON = 'text/json; charset=utf-8';


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
    const config = app.config[userStore];
    return {
        config,
        contentType: RT_JSON
    };
} // export function get
