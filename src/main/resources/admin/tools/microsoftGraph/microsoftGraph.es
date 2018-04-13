export function get(request) {
    return {
        body: '<html><head></head><body><h1>Hello world!</h1></body></html>',
        contentType: 'text/html; charset=utf-8'
    };
}
