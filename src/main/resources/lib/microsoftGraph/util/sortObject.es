export function sortObject(object) {
    const sortedObj = {};
    const keys = Object.keys(object);

    keys.sort((key1, key2) => {
        const lc1 = key1.toLowerCase();
        const lc2 = key2.toLowerCase();
        if (lc1 < lc2) return -1;
        if (lc1 > lc2) return 1;
        return 0;
    });

    keys.forEach((key) => {
        if (typeof object[key] === 'object' && !(object[key] instanceof Array)) {
            sortedObj[key] = sortObject(object[key]);
        } else {
            sortedObj[key] = object[key];
        }
    });

    return sortedObj;
}
