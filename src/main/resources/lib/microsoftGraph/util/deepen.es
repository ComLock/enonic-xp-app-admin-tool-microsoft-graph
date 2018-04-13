// https://stackoverflow.com/questions/7793811/convert-javascript-dot-notation-object-to-nested-object
// NOTE: This is risky if you have a same-name top level property. Wrap from t=oo; to t[key] = o[k] in if (k.indexOf('.') !== -1) ... – brandonscript Apr 14 '14 at 19:14
// NOTE: It also doesn't work if you have more than one top-level key. – brandonscript Apr 14 '14 at 19:15
export function deepen(o) {
    const oo = {};
    Object.keys(o).forEach((k) => {
        let t = oo;
        const parts = k.split('.');
        const key = parts.pop();
        while (parts.length) {
            const part = parts.shift();
            t[part] = t[part] || {};
            t = t[part];
        }
        t[key] = o[k];
    });
    return oo;
}

/* eslint-disable */
/*export function deepenJs5(o) {
    var oo = {}, t, parts, part;
    for (var k in o) {
        t = oo;
        parts = k.split('.');
        var key = parts.pop();
        while (parts.length) {
            part = parts.shift();
            t = t[part] = t[part] || {};
        }
        t[key] = o[k]
    }
    return oo;
}*/
