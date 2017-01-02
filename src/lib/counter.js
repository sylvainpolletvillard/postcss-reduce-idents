import valueParser, {walk} from "postcss-value-parser";
import addToCache from "./cache";
import isNum from "./isNum";

let cache        = {};
let declOneCache = [];
let declTwoCache = [];

export default {

    collect (node, encoder) {
        const {prop, type} = node;

        if (type === 'decl') {
            if (/counter-(reset|increment)/.test(prop)) {
                node.value = valueParser(node.value).walk(child => {
                    if (child.type === 'word' && !isNum(child)) {
                        addToCache(child.value, encoder, cache);
                        child.value = cache[child.value].ident;
                    } else if (child.type === 'space') {
                        child.value = ' ';
                    }
                });
                declOneCache.push(node);
            } else if (/content/.test(prop)) {
                declTwoCache.push(node);
            }
        }
    },

    transform () {
        declTwoCache.forEach(decl => {
            decl.value = valueParser(decl.value).walk(node => {
                const {type, value} = node;
                if (type === 'function' && (value === 'counter' || value === 'counters')) {
                    walk(node.nodes, child => {
                        if (child.type === 'word' && child.value in cache) {
                            cache[child.value].count++;
                            child.value = cache[child.value].ident;
                        } else if (child.type === 'div') {
                            child.before = child.after = '';
                        }
                    });
                }
                if (type === 'space') {
                    node.value = ' ';
                }
                return false;
            }).toString();
        });
        declOneCache.forEach(decl => {
            decl.value = decl.value.walk(node => {
                if (node.type === 'word' && !isNum(node)) {
                    Object.keys(cache).forEach(key => {
                        const cached = cache[key];
                        if (cached.ident === node.value && !cached.count) {
                            node.value = key;
                        }
                    });
                }
            }).toString();
        });

        // reset cache after transform
        cache        = {};
        declOneCache = [];
        declTwoCache = [];
    },

};
