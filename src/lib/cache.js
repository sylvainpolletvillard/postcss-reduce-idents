export function addToCache (value, encoder, cache) {
    if (cache[value]) {
        return;
    }
    cache[value] = {
        ident: encoder(value, Object.keys(cache).length),
        count: 0,
    };
}

export function cacheAtRule (node, encoder, {cache, ruleCache}) {
    const {params} = node;
    addToCache(params, encoder, cache);
    node.params = cache[params].ident;
    ruleCache.push(node);
}
