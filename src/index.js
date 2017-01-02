import valueParser from 'postcss-value-parser';
import postcss from 'postcss';
import encode from './lib/encode';
import {isNum, RESERVED_KEYWORDS} from "./lib/helpers";
import {transformCounterDecl, transformGridTemplateDecl, transformAtRule} from "./lib/transform";
import {cacheAtRule, addToCache} from "./lib/cache";

export default postcss.plugin('postcss-reduce-idents', ({
    counter = true,
    counterStyle = true,
    keyframes = true,
    gridTemplate = true,
    encoder = encode,
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
        const gridTemplateCache = {
            cache: {},
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
                if (gridTemplate) {
                    if (/(grid-template|grid-template-areas)/.test(prop)) {
                        valueParser(node.value).walk(child => {
                            if (child.type === 'string') {
                                child.value.split(/\s+/).forEach(word => {
                                    if (word && !RESERVED_KEYWORDS.includes(word)) {
                                        addToCache(word, encoder, gridTemplateCache.cache);
                                    }
                                });
                            }
                        });
                        gridTemplateCache.declCache.push(node);
                    } else if (/grid-area/.test(prop)) {
                        valueParser(node.value).walk(child => {
                            if (child.type === 'word' && !RESERVED_KEYWORDS.includes(child.value)) {
                                addToCache(child.value, encoder, gridTemplateCache.cache);
                            }
                        });
                        gridTemplateCache.declCache.push(node);
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
        counter      && transformCounterDecl(counterCache);
        counterStyle && transformAtRule(counterStyleCache);
        keyframes    && transformAtRule(keyframesCache);
        gridTemplate && transformGridTemplateDecl(gridTemplateCache);
    };
});
