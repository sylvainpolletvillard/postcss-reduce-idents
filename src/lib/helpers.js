import {unit} from "postcss-value-parser";

export function isNum (node) {
    return unit(node.value);
}

export const RESERVED_KEYWORDS = [
    "auto",
    "span",
    "inherit",
    "initial",
    "unset",
];
