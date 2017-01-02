import valueParser from 'postcss-value-parser';
import postcss from 'postcss';
import encode from './lib/encode';
import isNum from "./lib/helpers";
import {transformDecl, transformAtRule} from "./lib/transform";
import {cacheAtRule, addToCache} from "./lib/cache";

export default postcss.plugin('postcss-reduce-idents', ({
    counter = true,
    counterStyle = true,
    encoder = encode,
    keyframes = true,
} = {}) => {
    return css => {
        // Encode at rule names and cache the result

        const counterCache = {
            cache: {},
            declOneCache: [],
            declTwoCache: [],
        };
        const counterStyleCache = {
            cache: {},
            ruleCache: [],
            declCache: [],
        };
        const keyframesCache = {
            cache: {},
            ruleCache: [],
            declCache: [],
        };
        css.walk(node => {
            const {name, prop, type} = node;
            if (type === 'atrule') {
                if (counterStyle && /counter-style/.test(name)) {
                    cacheAtRule(node, encoder, counterStyleCache);
                }
                if (keyframes && /keyframes/.test(name)) {
                    cacheAtRule(node, encoder, keyframesCache);
                }
            }
            if (type === 'decl') {
                if (counter) {
                    if (/counter-(reset|increment)/.test(prop)) {
                        node.value = valueParser(node.value).walk(child => {
                            if (child.type === 'word' && !isNum(child)) {
                                addToCache(child.value, encoder, counterCache.cache);
                                child.value = counterCache.cache[child.value].ident;
                            } else if (child.type === 'space') {
                                child.value = ' ';
                            }
                        });
                        counterCache.declOneCache.push(node);
                    } else if (/content/.test(prop)) {
                        counterCache.declTwoCache.push(node);
                    }
                }
                if (counterStyle && /(list-style|system)/.test(prop)) {
                    counterStyleCache.declCache.push(node);
                }
                if (keyframes && /animation/.test(prop)) {
                    keyframesCache.declCache.push(node);
                }
            }
        });
        counter      && transformDecl(counterCache);
        counterStyle && transformAtRule(counterStyleCache);
        keyframes    && transformAtRule(keyframesCache);
    };
});
