import valueParser, {walk} from 'postcss-value-parser';
import isNum from "./helpers";

export function transformAtRule ({cache, ruleCache, declCache}) {
    // Iterate each property and change their names
    declCache.forEach(decl => {
        decl.value = valueParser(decl.value).walk(node => {
            if (node.type === 'word' && node.value in cache) {
                cache[node.value].count++;
                node.value = cache[node.value].ident;
            } else if (node.type === 'space') {
                node.value = ' ';
            } else if (node.type === 'div') {
                node.before = node.after = '';
            }
        }).toString();
    });
    // Ensure that at rules with no references to them are left unchanged
    ruleCache.forEach(rule => {
        Object.keys(cache).forEach(key => {
            const cached = cache[key];
            if (cached.ident === rule.params && !cached.count) {
                rule.params = key;
            }
        });
    });
}

export function transformDecl ({cache, declOneCache, declTwoCache}) {
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
}
