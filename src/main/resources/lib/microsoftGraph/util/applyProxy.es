export function applyProxy(config, requestParams) {
    if (config.proxy) {
        const proxy = {};
        if (config.proxy.host) { proxy.host = config.proxy.host; }
        if (config.proxy.port) { proxy.port = config.proxy.port; }
        if (config.proxy.user) { proxy.user = config.proxy.user; }
        if (config.proxy.password) { proxy.password = config.proxy.password; }
        requestParams.proxy = proxy; // eslint-disable-line no-param-reassign
    }
}
