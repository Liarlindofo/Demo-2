(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/globals.tsx
__turbopack_context__.s([
    "createGlobal",
    ()=>createGlobal,
    "getGlobal",
    ()=>getGlobal,
    "globalVar",
    ()=>globalVar,
    "setGlobal",
    ()=>setGlobal
]);
var globalVar = typeof globalThis !== "undefined" ? globalThis : ("TURBOPACK compile-time truthy", 1) ? /*TURBOPACK member replacement*/ __turbopack_context__.g : "TURBOPACK unreachable";
if (typeof globalThis === "undefined") {
    globalVar.globalThis = globalVar;
}
var stackGlobalsSymbol = Symbol.for("__stack-globals");
globalVar[stackGlobalsSymbol] ??= {};
function createGlobal(key, init) {
    if (!globalVar[stackGlobalsSymbol][key]) {
        globalVar[stackGlobalsSymbol][key] = init();
    }
    return globalVar[stackGlobalsSymbol][key];
}
function getGlobal(key) {
    return globalVar[stackGlobalsSymbol][key];
}
function setGlobal(key, value) {
    globalVar[stackGlobalsSymbol][key] = value;
}
;
 //# sourceMappingURL=globals.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/compile-time.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/compile-time.tsx
__turbopack_context__.s([
    "scrambleDuringCompileTime",
    ()=>scrambleDuringCompileTime
]);
function scrambleDuringCompileTime(t) {
    if (Math.random() < 1e-5 && Math.random() > 0.99999 && Math.random() < 1e-5 && Math.random() > 0.99999) {
        return "this will never happen";
    }
    return t;
}
;
 //# sourceMappingURL=compile-time.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/functions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/functions.tsx
__turbopack_context__.s([
    "identity",
    ()=>identity,
    "identityArgs",
    ()=>identityArgs
]);
function identity(t) {
    return t;
}
function identityArgs(...args) {
    return args;
}
;
 //# sourceMappingURL=functions.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/math.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/math.tsx
__turbopack_context__.s([
    "remainder",
    ()=>remainder
]);
function remainder(n, d) {
    return (n % d + Math.abs(d)) % d;
}
;
 //# sourceMappingURL=math.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/arrays.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/arrays.tsx
__turbopack_context__.s([
    "enumerate",
    ()=>enumerate,
    "findLastIndex",
    ()=>findLastIndex,
    "getChunks",
    ()=>getChunks,
    "groupBy",
    ()=>groupBy,
    "isBooleanArray",
    ()=>isBooleanArray,
    "isNumberArray",
    ()=>isNumberArray,
    "isObjectArray",
    ()=>isObjectArray,
    "isShallowEqual",
    ()=>isShallowEqual,
    "isStringArray",
    ()=>isStringArray,
    "outerProduct",
    ()=>outerProduct,
    "range",
    ()=>range,
    "rotateLeft",
    ()=>rotateLeft,
    "rotateRight",
    ()=>rotateRight,
    "shuffle",
    ()=>shuffle,
    "typedIncludes",
    ()=>typedIncludes,
    "unique",
    ()=>unique
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$math$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/math.js [app-client] (ecmascript)");
;
function typedIncludes(arr, item) {
    return arr.includes(item);
}
function enumerate(arr) {
    return arr.map((item, index)=>[
            index,
            item
        ]);
}
function isShallowEqual(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < a.length; i++){
        if (a[i] !== b[i]) return false;
    }
    return true;
}
function findLastIndex(arr, predicate) {
    for(let i = arr.length - 1; i >= 0; i--){
        if (predicate(arr[i])) return i;
    }
    return -1;
}
function groupBy(arr, key) {
    const result = /* @__PURE__ */ new Map();
    for (const item of arr){
        const k = key(item);
        if (result.get(k) === void 0) result.set(k, []);
        result.get(k).push(item);
    }
    return result;
}
function range(startInclusive, endExclusive, step) {
    if (endExclusive === void 0) {
        endExclusive = startInclusive;
        startInclusive = 0;
    }
    if (step === void 0) step = 1;
    const result = [];
    for(let i = startInclusive; step > 0 ? i < endExclusive : i > endExclusive; i += step){
        result.push(i);
    }
    return result;
}
function rotateLeft(arr, n) {
    if (arr.length === 0) return [];
    const index = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$math$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["remainder"])(n, arr.length);
    return [
        ...arr.slice(index),
        ...arr.slice(0, index)
    ];
}
function rotateRight(arr, n) {
    return rotateLeft(arr, -n);
}
function shuffle(arr) {
    const result = [
        ...arr
    ];
    for(let i = result.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [
            result[j],
            result[i]
        ];
    }
    return result;
}
function outerProduct(arr1, arr2) {
    return arr1.flatMap((item1)=>arr2.map((item2)=>[
                item1,
                item2
            ]));
}
function unique(arr) {
    return [
        ...new Set(arr)
    ];
}
function getChunks(arr, size) {
    const result = [];
    if (size <= 0) return result;
    for(let i = 0; i < arr.length; i += size){
        result.push(arr.slice(i, i + size));
    }
    return result;
}
function isStringArray(arr) {
    return Array.isArray(arr) && arr.every((item)=>typeof item === "string");
}
function isNumberArray(arr) {
    return Array.isArray(arr) && arr.every((item)=>typeof item === "number");
}
function isBooleanArray(arr) {
    return Array.isArray(arr) && arr.every((item)=>typeof item === "boolean");
}
function isObjectArray(arr) {
    return Array.isArray(arr) && arr.every((item)=>typeof item === "object" && item !== null);
}
;
 //# sourceMappingURL=arrays.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/strings.tsx
__turbopack_context__.s([
    "deindent",
    ()=>deindent,
    "deindentTemplate",
    ()=>deindentTemplate,
    "escapeTemplateLiteral",
    ()=>escapeTemplateLiteral,
    "extractScopes",
    ()=>extractScopes,
    "getWhitespacePrefix",
    ()=>getWhitespacePrefix,
    "getWhitespaceSuffix",
    ()=>getWhitespaceSuffix,
    "mergeScopeStrings",
    ()=>mergeScopeStrings,
    "nicify",
    ()=>nicify,
    "replaceAll",
    ()=>replaceAll,
    "stringCompare",
    ()=>stringCompare,
    "templateIdentity",
    ()=>templateIdentity,
    "trimEmptyLinesEnd",
    ()=>trimEmptyLinesEnd,
    "trimEmptyLinesStart",
    ()=>trimEmptyLinesStart,
    "trimLines",
    ()=>trimLines,
    "typedCapitalize",
    ()=>typedCapitalize,
    "typedJoin",
    ()=>typedJoin,
    "typedToLowercase",
    ()=>typedToLowercase,
    "typedToUppercase",
    ()=>typedToUppercase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$arrays$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/arrays.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
;
;
;
function typedJoin(strings, separator) {
    return strings.join(separator);
}
function typedToLowercase(s) {
    if (typeof s !== "string") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Expected a string for typedToLowercase", {
        s
    });
    return s.toLowerCase();
}
function typedToUppercase(s) {
    if (typeof s !== "string") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Expected a string for typedToUppercase", {
        s
    });
    return s.toUpperCase();
}
function typedCapitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function stringCompare(a, b) {
    if (typeof a !== "string" || typeof b !== "string") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Expected two strings for stringCompare, found ${typeof a} and ${typeof b}`, {
        a,
        b
    });
    const cmp = (a2, b2)=>a2 < b2 ? -1 : a2 > b2 ? 1 : 0;
    return cmp(a.toUpperCase(), b.toUpperCase()) || cmp(b, a);
}
function getWhitespacePrefix(s) {
    return s.substring(0, s.length - s.trimStart().length);
}
function getWhitespaceSuffix(s) {
    return s.substring(s.trimEnd().length);
}
function trimEmptyLinesStart(s) {
    const lines = s.split("\n");
    const firstNonEmptyLineIndex = lines.findIndex((line)=>line.trim() !== "");
    if (firstNonEmptyLineIndex === -1) return "";
    return lines.slice(firstNonEmptyLineIndex).join("\n");
}
function trimEmptyLinesEnd(s) {
    const lines = s.split("\n");
    const lastNonEmptyLineIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$arrays$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findLastIndex"])(lines, (line)=>line.trim() !== "");
    return lines.slice(0, lastNonEmptyLineIndex + 1).join("\n");
}
function trimLines(s) {
    return trimEmptyLinesEnd(trimEmptyLinesStart(s));
}
function templateIdentity(strings, ...values) {
    if (values.length !== strings.length - 1) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid number of values; must be one less than strings", {
        strings,
        values
    });
    return strings.reduce((result, str, i)=>result + str + (values[i] ?? ""), "");
}
function deindent(strings, ...values) {
    if (typeof strings === "string") return deindent([
        strings
    ]);
    return templateIdentity(...deindentTemplate(strings, ...values));
}
function deindentTemplate(strings, ...values) {
    if (values.length !== strings.length - 1) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid number of values; must be one less than strings", {
        strings,
        values
    });
    const trimmedStrings = [
        ...strings
    ];
    trimmedStrings[0] = trimEmptyLinesStart(trimmedStrings[0] + "+").slice(0, -1);
    trimmedStrings[trimmedStrings.length - 1] = trimEmptyLinesEnd("+" + trimmedStrings[trimmedStrings.length - 1]).slice(1);
    const indentation = trimmedStrings.join("${SOME_VALUE}").split("\n").filter((line)=>line.trim() !== "").map((line)=>getWhitespacePrefix(line).length).reduce((min, current)=>Math.min(min, current), Infinity);
    const deindentedStrings = trimmedStrings.map((string, stringIndex)=>{
        return string.split("\n").map((line, lineIndex)=>stringIndex !== 0 && lineIndex === 0 ? line : line.substring(indentation)).join("\n");
    });
    const indentedValues = values.map((value, i)=>{
        const firstLineIndentation = getWhitespacePrefix(deindentedStrings[i].split("\n").at(-1));
        return `${value}`.replaceAll("\n", `
${firstLineIndentation}`);
    });
    return [
        deindentedStrings,
        ...indentedValues
    ];
}
function extractScopes(scope, removeDuplicates = true) {
    const trimmedString = scope.trim();
    const scopesArray = trimmedString.split(/\s+/);
    const filtered = scopesArray.filter((scope2)=>scope2.length > 0);
    return removeDuplicates ? [
        ...new Set(filtered)
    ] : filtered;
}
function mergeScopeStrings(...scopes) {
    const allScope = scopes.map((s)=>extractScopes(s)).flat().join(" ");
    return extractScopes(allScope).join(" ");
}
function escapeTemplateLiteral(s) {
    return s.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
}
var nicifiableClassNameOverrides = new Map(Object.entries({
    Headers
}).map(([k, v])=>[
        v,
        k
    ]));
function nicify(value, options = {}) {
    const fullOptions = {
        maxDepth: 5,
        currentIndent: "",
        lineIndent: "  ",
        multiline: true,
        refs: /* @__PURE__ */ new Map(),
        path: "value",
        parent: null,
        overrides: ()=>null,
        keyInParent: null,
        hideFields: [],
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])(options)
    };
    const { maxDepth, currentIndent, lineIndent, multiline, refs, path, overrides, hideFields } = fullOptions;
    const nl = `
${currentIndent}`;
    const overrideResult = overrides(value, options);
    if (overrideResult !== null) return overrideResult;
    if ([
        "function",
        "object",
        "symbol"
    ].includes(typeof value) && value !== null) {
        if (refs.has(value)) {
            return `Ref<${refs.get(value)}>`;
        }
        refs.set(value, path);
    }
    const newOptions = {
        maxDepth: maxDepth - 1,
        currentIndent,
        lineIndent,
        multiline,
        refs,
        path: path + "->[unknown property]",
        overrides,
        parent: {
            value,
            options: fullOptions
        },
        keyInParent: null,
        hideFields: []
    };
    const nestedNicify = (newValue, newPath, keyInParent, options2 = {})=>{
        return nicify(newValue, {
            ...newOptions,
            path: newPath,
            currentIndent: currentIndent + lineIndent,
            keyInParent,
            ...options2
        });
    };
    switch(typeof value){
        case "boolean":
        case "number":
            {
                return JSON.stringify(value);
            }
        case "string":
            {
                const isDeindentable = (v)=>deindent(v) === v && v.includes("\n");
                const wrapInDeindent = (v)=>deindent`
        deindent\`
        ${currentIndent + lineIndent}${escapeTemplateLiteral(v).replaceAll("\n", nl + lineIndent)}
        ${currentIndent}\`
      `;
                if (isDeindentable(value)) {
                    return wrapInDeindent(value);
                } else if (value.endsWith("\n") && isDeindentable(value.slice(0, -1))) {
                    return wrapInDeindent(value.slice(0, -1)) + ' + "\\n"';
                } else {
                    return JSON.stringify(value);
                }
            }
        case "undefined":
            {
                return "undefined";
            }
        case "symbol":
            {
                return value.toString();
            }
        case "bigint":
            {
                return `${value}n`;
            }
        case "function":
            {
                if (value.name) return `function ${value.name}(...) { ... }`;
                return `(...) => { ... }`;
            }
        case "object":
            {
                if (value === null) return "null";
                if (Array.isArray(value)) {
                    const extraLines2 = getNicifiedObjectExtraLines(value);
                    const resValueLength2 = value.length + extraLines2.length;
                    if (resValueLength2 === 0) return "[]";
                    if (maxDepth <= 0) return `[...]`;
                    const resValues2 = value.map((v, i)=>nestedNicify(v, `${path}[${i}]`, i));
                    resValues2.push(...extraLines2);
                    if (resValues2.length !== resValueLength2) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("nicify of object: resValues.length !== resValueLength", {
                        value,
                        resValues: resValues2,
                        resValueLength: resValueLength2
                    });
                    const shouldIndent2 = resValues2.length > 4 || resValues2.some((x)=>resValues2.length > 1 && x.length > 4 || x.includes("\n"));
                    if (shouldIndent2) {
                        return `[${nl}${resValues2.map((x)=>`${lineIndent}${x},${nl}`).join("")}]`;
                    } else {
                        return `[${resValues2.join(", ")}]`;
                    }
                }
                if (value instanceof Date) {
                    return `Date(${nestedNicify(value.toISOString(), `${path}.toISOString()`, null)})`;
                }
                if (value instanceof URL) {
                    return `URL(${nestedNicify(value.toString(), `${path}.toString()`, null)})`;
                }
                if (ArrayBuffer.isView(value)) {
                    return `${value.constructor.name}([${value.toString()}])`;
                }
                if (value instanceof ArrayBuffer) {
                    return `ArrayBuffer [${new Uint8Array(value).toString()}]`;
                }
                if (value instanceof Error) {
                    let stack = value.stack ?? "";
                    const toString = value.toString();
                    if (!stack.startsWith(toString)) stack = `${toString}
${stack}`;
                    stack = stack.trimEnd();
                    stack = stack.replace(/\n\s+/g, `
${lineIndent}${lineIndent}`);
                    stack = stack.replace("\n", `
${lineIndent}Stack:
`);
                    if (Object.keys(value).length > 0) {
                        stack += `
${lineIndent}Extra properties: ${nestedNicify(Object.fromEntries(Object.entries(value)), path, null)}`;
                    }
                    if (value.cause) {
                        stack += `
${lineIndent}Cause:
${lineIndent}${lineIndent}${nestedNicify(value.cause, path, null, {
                            currentIndent: currentIndent + lineIndent + lineIndent
                        })}`;
                    }
                    stack = stack.replaceAll("\n", `
${currentIndent}`);
                    return stack;
                }
                const constructorName = [
                    null,
                    Object.prototype
                ].includes(Object.getPrototypeOf(value)) ? null : nicifiableClassNameOverrides.get(value.constructor) ?? value.constructor.name;
                const constructorString = constructorName ? `${constructorName} ` : "";
                const entries = getNicifiableEntries(value).filter(([k])=>!hideFields.includes(k));
                const extraLines = [
                    ...getNicifiedObjectExtraLines(value),
                    ...hideFields.length > 0 ? [
                        `<some fields may have been hidden>`
                    ] : []
                ];
                const resValueLength = entries.length + extraLines.length;
                if (resValueLength === 0) return `${constructorString}{}`;
                if (maxDepth <= 0) return `${constructorString}{ ... }`;
                const resValues = entries.map(([k, v], keyIndex)=>{
                    const keyNicified = nestedNicify(k, `Object.keys(${path})[${keyIndex}]`, null);
                    const keyInObjectLiteral = typeof k === "string" ? nicifyPropertyString(k) : `[${keyNicified}]`;
                    if (typeof v === "function" && v.name === k) {
                        return `${keyInObjectLiteral}(...): { ... }`;
                    } else {
                        return `${keyInObjectLiteral}: ${nestedNicify(v, `${path}[${keyNicified}]`, k)}`;
                    }
                });
                resValues.push(...extraLines);
                if (resValues.length !== resValueLength) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("nicify of object: resValues.length !== resValueLength", {
                    value,
                    resValues,
                    resValueLength
                });
                const shouldIndent = resValues.length > 1 || resValues.some((x)=>x.includes("\n"));
                if (resValues.length === 0) return `${constructorString}{}`;
                if (shouldIndent) {
                    return `${constructorString}{${nl}${resValues.map((x)=>`${lineIndent}${x},${nl}`).join("")}}`;
                } else {
                    return `${constructorString}{ ${resValues.join(", ")} }`;
                }
            }
        default:
            {
                return `${typeof value}<${value}>`;
            }
    }
}
function replaceAll(input, searchValue, replaceValue) {
    if (searchValue === "") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("replaceAll: searchValue is empty");
    return input.split(searchValue).join(replaceValue);
}
function nicifyPropertyString(str) {
    return JSON.stringify(str);
}
function getNicifiableKeys(value) {
    const overridden = ("getNicifiableKeys" in value ? value.getNicifiableKeys?.bind(value) : null)?.();
    if (overridden != null) return overridden;
    if (value instanceof Response) {
        return [
            "status",
            "headers"
        ];
    }
    const keys = Object.keys(value).sort();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$arrays$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["unique"])(keys);
}
function getNicifiableEntries(value) {
    const recordLikes = [
        Headers
    ];
    function isRecordLike(value2) {
        return recordLikes.some((x)=>value2 instanceof x);
    }
    if (isRecordLike(value)) {
        return [
            ...value.entries()
        ].sort(([a], [b])=>stringCompare(`${a}`, `${b}`));
    }
    const keys = getNicifiableKeys(value);
    return keys.map((k)=>[
            k,
            value[k]
        ]);
}
function getNicifiedObjectExtraLines(value) {
    return ("getNicifiedObjectExtraLines" in value ? value.getNicifiedObjectExtraLines : null)?.() ?? [];
}
;
 //# sourceMappingURL=strings.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/types.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/types.tsx
__turbopack_context__.s([
    "typeAssert",
    ()=>typeAssert,
    "typeAssertExtends",
    ()=>typeAssertExtends,
    "typeAssertIs",
    ()=>typeAssertIs
]);
typeAssertIs()();
typeAssertIs()();
typeAssertIs()();
function typeAssert() {
    return ()=>void 0;
}
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
function typeAssertExtends() {
    return ()=>void 0;
}
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
function typeAssertIs() {
    return ()=>void 0;
}
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
typeAssertExtends()();
;
 //# sourceMappingURL=types.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/objects.tsx
__turbopack_context__.s([
    "deepFilterUndefined",
    ()=>deepFilterUndefined,
    "deepMerge",
    ()=>deepMerge,
    "deepPlainClone",
    ()=>deepPlainClone,
    "deepPlainEquals",
    ()=>deepPlainEquals,
    "deepSortKeys",
    ()=>deepSortKeys,
    "deleteKey",
    ()=>deleteKey,
    "filterUndefined",
    ()=>filterUndefined,
    "filterUndefinedOrNull",
    ()=>filterUndefinedOrNull,
    "get",
    ()=>get,
    "getOrUndefined",
    ()=>getOrUndefined,
    "has",
    ()=>has,
    "hasAndNotUndefined",
    ()=>hasAndNotUndefined,
    "isCloneable",
    ()=>isCloneable,
    "isNotNull",
    ()=>isNotNull,
    "isObjectLike",
    ()=>isObjectLike,
    "mapValues",
    ()=>mapValues,
    "omit",
    ()=>omit,
    "pick",
    ()=>pick,
    "set",
    ()=>set,
    "shallowClone",
    ()=>shallowClone,
    "sortKeys",
    ()=>sortKeys,
    "split",
    ()=>split,
    "typedAssign",
    ()=>typedAssign,
    "typedEntries",
    ()=>typedEntries,
    "typedFromEntries",
    ()=>typedFromEntries,
    "typedKeys",
    ()=>typedKeys,
    "typedValues",
    ()=>typedValues
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/types.js [app-client] (ecmascript)");
;
;
;
;
function isNotNull(value) {
    return value !== null && value !== void 0;
}
function deepPlainEquals(obj1, obj2, options = {}) {
    if (typeof obj1 !== typeof obj2) return false;
    if (obj1 === obj2) return true;
    switch(typeof obj1){
        case "object":
            {
                if (!obj1 || !obj2) return false;
                if (Array.isArray(obj1) || Array.isArray(obj2)) {
                    if (!Array.isArray(obj1) || !Array.isArray(obj2)) return false;
                    if (obj1.length !== obj2.length) return false;
                    return obj1.every((v, i)=>deepPlainEquals(v, obj2[i], options));
                }
                const entries1 = Object.entries(obj1).filter(([k, v])=>!options.ignoreUndefinedValues || v !== void 0);
                const entries2 = Object.entries(obj2).filter(([k, v])=>!options.ignoreUndefinedValues || v !== void 0);
                if (entries1.length !== entries2.length) return false;
                return entries1.every(([k, v1])=>{
                    const e2 = entries2.find(([k2])=>k === k2);
                    if (!e2) return false;
                    return deepPlainEquals(v1, e2[1], options);
                });
            }
        case "undefined":
        case "string":
        case "number":
        case "boolean":
        case "bigint":
        case "symbol":
        case "function":
            {
                return false;
            }
        default:
            {
                throw new Error("Unexpected typeof " + typeof obj1);
            }
    }
}
function isCloneable(obj) {
    return typeof obj !== "symbol" && typeof obj !== "function";
}
function shallowClone(obj) {
    if (!isCloneable(obj)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("shallowClone does not support symbols or functions", {
        obj
    });
    if (Array.isArray(obj)) return obj.map(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["identity"]);
    return {
        ...obj
    };
}
function deepPlainClone(obj) {
    if (typeof obj === "function") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("deepPlainClone does not support functions");
    if (typeof obj === "symbol") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("deepPlainClone does not support symbols");
    if (typeof obj !== "object" || !obj) return obj;
    if (Array.isArray(obj)) return obj.map(deepPlainClone);
    return Object.fromEntries(Object.entries(obj).map(([k, v])=>[
            k,
            deepPlainClone(v)
        ]));
}
function deepMerge(baseObj, mergeObj) {
    if ([
        baseObj,
        mergeObj,
        ...Object.values(baseObj),
        ...Object.values(mergeObj)
    ].some((o)=>!isCloneable(o))) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("deepMerge does not support functions or symbols", {
        baseObj,
        mergeObj
    });
    const res = shallowClone(baseObj);
    for (const [key, mergeValue] of Object.entries(mergeObj)){
        if (has(res, key)) {
            const baseValue = get(res, key);
            if (isObjectLike(baseValue) && isObjectLike(mergeValue)) {
                set(res, key, deepMerge(baseValue, mergeValue));
                continue;
            }
        }
        set(res, key, mergeValue);
    }
    return res;
}
function typedEntries(obj) {
    return Object.entries(obj);
}
function typedFromEntries(entries) {
    return Object.fromEntries(entries);
}
function typedKeys(obj) {
    return Object.keys(obj);
}
function typedValues(obj) {
    return Object.values(obj);
}
function typedAssign(target, source) {
    return Object.assign(target, source);
}
function filterUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, v])=>v !== void 0));
}
function filterUndefinedOrNull(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, v])=>v !== void 0 && v !== null));
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typeAssertIs"])()();
function deepFilterUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, v])=>v !== void 0).map(([k, v])=>[
            k,
            isObjectLike(v) ? deepFilterUndefined(v) : v
        ]));
}
function pick(obj, keys) {
    return Object.fromEntries(Object.entries(obj).filter(([k])=>keys.includes(k)));
}
function omit(obj, keys) {
    if (!Array.isArray(keys)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("omit: keys must be an array", {
        obj,
        keys
    });
    return Object.fromEntries(Object.entries(obj).filter(([k])=>!keys.includes(k)));
}
function split(obj, keys) {
    return [
        pick(obj, keys),
        omit(obj, keys)
    ];
}
function mapValues(obj, fn) {
    if (Array.isArray(obj)) {
        return obj.map((v)=>fn(v));
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v])=>[
            k,
            fn(v)
        ]));
}
function sortKeys(obj) {
    if (Array.isArray(obj)) {
        return [
            ...obj
        ];
    }
    return Object.fromEntries(Object.entries(obj).sort(([a], [b])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stringCompare"])(a, b)));
}
function deepSortKeys(obj) {
    return sortKeys(mapValues(obj, (v)=>isObjectLike(v) ? deepSortKeys(v) : v));
}
function set(obj, key, value) {
    if (!isObjectLike(obj)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`set: obj is not an object (found: ${obj === null ? "null" : typeof obj})`, {
        obj,
        key,
        value
    });
    Object.defineProperty(obj, key, {
        value,
        writable: true,
        configurable: true,
        enumerable: true
    });
}
function get(obj, key) {
    if (obj == null) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("get: obj is null or undefined", {
        obj,
        key
    });
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (!descriptor) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`get: key ${String(key)} does not exist`, {
        obj,
        key
    });
    return descriptor.value;
}
function getOrUndefined(obj, key) {
    if (obj == null) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("getOrUndefined: obj is null or undefined", {
        obj,
        key
    });
    return has(obj, key) ? get(obj, key) : void 0;
}
function has(obj, key) {
    if (obj == null) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("has: obj is null or undefined", {
        obj,
        key
    });
    return Object.prototype.hasOwnProperty.call(obj, key);
}
function hasAndNotUndefined(obj, key) {
    return has(obj, key) && get(obj, key) !== void 0;
}
function deleteKey(obj, key) {
    if (has(obj, key)) {
        Reflect.deleteProperty(obj, key);
    } else {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`deleteKey: key ${String(key)} does not exist`, {
            obj,
            key
        });
    }
}
function isObjectLike(value) {
    return (typeof value === "object" || typeof value === "function") && value !== null;
}
;
 //# sourceMappingURL=objects.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/errors.tsx
__turbopack_context__.s([
    "StackAssertionError",
    ()=>StackAssertionError,
    "StatusError",
    ()=>StatusError,
    "captureError",
    ()=>captureError,
    "concatStacktraces",
    ()=>concatStacktraces,
    "errorToNiceString",
    ()=>errorToNiceString,
    "registerErrorSink",
    ()=>registerErrorSink,
    "throwErr",
    ()=>throwErr
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
;
function throwErr(...args) {
    if (typeof args[0] === "string") {
        throw new StackAssertionError(args[0], args[1]);
    } else if (args[0] instanceof Error) {
        throw args[0];
    } else {
        throw new StatusError(...args);
    }
}
function removeStacktraceNameLine(stack) {
    const addsNameLine = new Error().stack?.startsWith("Error\n");
    return stack.split("\n").slice(addsNameLine ? 1 : 0).join("\n");
}
function concatStacktraces(first, ...errors) {
    const addsEmptyLineAtEnd = first.stack?.endsWith("\n");
    const separator = removeStacktraceNameLine(new Error().stack ?? "").split("\n")[0];
    for (const error of errors){
        const toAppend = removeStacktraceNameLine(error.stack ?? "");
        first.stack += (addsEmptyLineAtEnd ? "" : "\n") + separator + "\n" + toAppend;
    }
}
var StackAssertionError = class extends Error {
    constructor(message, extraData){
        const disclaimer = `

This is likely an error in Stack. Please make sure you are running the newest version and report it.`;
        super(`${message}${message.endsWith(disclaimer) ? "" : disclaimer}`, (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pick"])(extraData ?? {}, [
            "cause"
        ]));
        this.extraData = extraData;
        Object.defineProperty(this, "customCaptureExtraArgs", {
            get () {
                return [
                    this.extraData
                ];
            },
            enumerable: false
        });
        if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STACK_DEBUGGER_ON_ASSERTION_ERROR === "true") {
            debugger;
        }
    }
};
StackAssertionError.prototype.name = "StackAssertionError";
function errorToNiceString(error) {
    if (!(error instanceof Error)) return `${typeof error}<${(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nicify"])(error)}>`;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nicify"])(error, {
        maxDepth: 8
    });
}
var errorSinks = /* @__PURE__ */ new Set();
function registerErrorSink(sink) {
    if (errorSinks.has(sink)) {
        return;
    }
    errorSinks.add(sink);
}
registerErrorSink((location, error, ...extraArgs)=>{
    console.error(`\x1B[41mCaptured error in ${location}:`, // HACK: Log a nicified version of the error to get around buggy Next.js pretty-printing
    // https://www.reddit.com/r/nextjs/comments/1gkxdqe/comment/m19kxgn/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
    errorToNiceString(error), ...extraArgs, "\x1B[0m");
});
registerErrorSink((location, error, ...extraArgs)=>{
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].stackCapturedErrors = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].stackCapturedErrors ?? [];
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].stackCapturedErrors.push({
        location,
        error,
        extraArgs
    });
});
function captureError(location, error) {
    for (const sink of errorSinks){
        sink(location, error, ...error && (typeof error === "object" || typeof error === "function") && "customCaptureExtraArgs" in error && Array.isArray(error.customCaptureExtraArgs) ? error.customCaptureExtraArgs : []);
    }
}
var StatusError = class extends Error {
    constructor(status, message){
        if (typeof status === "object") {
            message ??= status.message;
            status = status.statusCode;
        }
        super(message);
        this.__stackStatusErrorBrand = "stack-status-error-brand-sentinel";
        this.name = "StatusError";
        this.statusCode = status;
        if (!message) {
            throw new StackAssertionError("StatusError always requires a message unless a Status object is passed", {
                cause: this
            });
        }
    }
    static isStatusError(error) {
        return typeof error === "object" && error !== null && "__stackStatusErrorBrand" in error && error.__stackStatusErrorBrand === "stack-status-error-brand-sentinel";
    }
    isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }
    isServerError() {
        return !this.isClientError();
    }
    getStatusCode() {
        return this.statusCode;
    }
    getBody() {
        return new TextEncoder().encode(this.message);
    }
    getHeaders() {
        return {
            "Content-Type": [
                "text/plain; charset=utf-8"
            ]
        };
    }
    toDescriptiveJson() {
        return {
            status_code: this.getStatusCode(),
            message: this.message,
            headers: this.getHeaders()
        };
    }
    /**
   * @deprecated this is not a good way to make status errors human-readable, use toDescriptiveJson instead
   */ toHttpJson() {
        return {
            status_code: this.statusCode,
            body: this.message,
            headers: this.getHeaders()
        };
    }
};
StatusError.BadRequest = {
    statusCode: 400,
    message: "Bad Request"
};
StatusError.Unauthorized = {
    statusCode: 401,
    message: "Unauthorized"
};
StatusError.PaymentRequired = {
    statusCode: 402,
    message: "Payment Required"
};
StatusError.Forbidden = {
    statusCode: 403,
    message: "Forbidden"
};
StatusError.NotFound = {
    statusCode: 404,
    message: "Not Found"
};
StatusError.MethodNotAllowed = {
    statusCode: 405,
    message: "Method Not Allowed"
};
StatusError.NotAcceptable = {
    statusCode: 406,
    message: "Not Acceptable"
};
StatusError.ProxyAuthenticationRequired = {
    statusCode: 407,
    message: "Proxy Authentication Required"
};
StatusError.RequestTimeout = {
    statusCode: 408,
    message: "Request Timeout"
};
StatusError.Conflict = {
    statusCode: 409,
    message: "Conflict"
};
StatusError.Gone = {
    statusCode: 410,
    message: "Gone"
};
StatusError.LengthRequired = {
    statusCode: 411,
    message: "Length Required"
};
StatusError.PreconditionFailed = {
    statusCode: 412,
    message: "Precondition Failed"
};
StatusError.PayloadTooLarge = {
    statusCode: 413,
    message: "Payload Too Large"
};
StatusError.URITooLong = {
    statusCode: 414,
    message: "URI Too Long"
};
StatusError.UnsupportedMediaType = {
    statusCode: 415,
    message: "Unsupported Media Type"
};
StatusError.RangeNotSatisfiable = {
    statusCode: 416,
    message: "Range Not Satisfiable"
};
StatusError.ExpectationFailed = {
    statusCode: 417,
    message: "Expectation Failed"
};
StatusError.ImATeapot = {
    statusCode: 418,
    message: "I'm a teapot"
};
StatusError.MisdirectedRequest = {
    statusCode: 421,
    message: "Misdirected Request"
};
StatusError.UnprocessableEntity = {
    statusCode: 422,
    message: "Unprocessable Entity"
};
StatusError.Locked = {
    statusCode: 423,
    message: "Locked"
};
StatusError.FailedDependency = {
    statusCode: 424,
    message: "Failed Dependency"
};
StatusError.TooEarly = {
    statusCode: 425,
    message: "Too Early"
};
StatusError.UpgradeRequired = {
    statusCode: 426,
    message: "Upgrade Required"
};
StatusError.PreconditionRequired = {
    statusCode: 428,
    message: "Precondition Required"
};
StatusError.TooManyRequests = {
    statusCode: 429,
    message: "Too Many Requests"
};
StatusError.RequestHeaderFieldsTooLarge = {
    statusCode: 431,
    message: "Request Header Fields Too Large"
};
StatusError.UnavailableForLegalReasons = {
    statusCode: 451,
    message: "Unavailable For Legal Reasons"
};
StatusError.InternalServerError = {
    statusCode: 500,
    message: "Internal Server Error"
};
StatusError.NotImplemented = {
    statusCode: 501,
    message: "Not Implemented"
};
StatusError.BadGateway = {
    statusCode: 502,
    message: "Bad Gateway"
};
StatusError.ServiceUnavailable = {
    statusCode: 503,
    message: "Service Unavailable"
};
StatusError.GatewayTimeout = {
    statusCode: 504,
    message: "Gateway Timeout"
};
StatusError.HTTPVersionNotSupported = {
    statusCode: 505,
    message: "HTTP Version Not Supported"
};
StatusError.VariantAlsoNegotiates = {
    statusCode: 506,
    message: "Variant Also Negotiates"
};
StatusError.InsufficientStorage = {
    statusCode: 507,
    message: "Insufficient Storage"
};
StatusError.LoopDetected = {
    statusCode: 508,
    message: "Loop Detected"
};
StatusError.NotExtended = {
    statusCode: 510,
    message: "Not Extended"
};
StatusError.NetworkAuthenticationRequired = {
    statusCode: 511,
    message: "Network Authentication Required"
};
StatusError.prototype.name = "StatusError";
;
 //# sourceMappingURL=errors.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/known-errors.tsx
__turbopack_context__.s([
    "KnownError",
    ()=>KnownError,
    "KnownErrors",
    ()=>KnownErrors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/functions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
;
var KnownError = class extends __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusError"] {
    constructor(statusCode, humanReadableMessage, details){
        super(statusCode, humanReadableMessage);
        this.statusCode = statusCode;
        this.humanReadableMessage = humanReadableMessage;
        this.details = details;
        this.__stackKnownErrorBrand = "stack-known-error-brand-sentinel";
        this.name = "KnownError";
    }
    static isKnownError(error) {
        return typeof error === "object" && error !== null && "__stackKnownErrorBrand" in error && error.__stackKnownErrorBrand === "stack-known-error-brand-sentinel";
    }
    getBody() {
        return new TextEncoder().encode(JSON.stringify(this.toDescriptiveJson(), void 0, 2));
    }
    getHeaders() {
        return {
            "Content-Type": [
                "application/json; charset=utf-8"
            ],
            "X-Stack-Known-Error": [
                this.errorCode
            ]
        };
    }
    toDescriptiveJson() {
        return {
            code: this.errorCode,
            ...this.details ? {
                details: this.details
            } : {},
            error: this.humanReadableMessage
        };
    }
    get errorCode() {
        return this.constructor.errorCode ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(`Can't find error code for this KnownError. Is its constructor a KnownErrorConstructor? ${this}`);
    }
    static constructorArgsFromJson(json) {
        return [
            400,
            json.message,
            json
        ];
    }
    static fromJson(json) {
        for (const [_, KnownErrorType] of Object.entries(KnownErrors)){
            if (json.code === KnownErrorType.prototype.errorCode) {
                const constructorArgs = KnownErrorType.constructorArgsFromJson(json);
                return new KnownErrorType(...constructorArgs);
            }
        }
        throw new Error(`Unknown KnownError code. You may need to update your version of Stack to see more detailed information. ${json.code}: ${json.message}`);
    }
};
var knownErrorConstructorErrorCodeSentinel = Symbol("knownErrorConstructorErrorCodeSentinel");
function createKnownErrorConstructor(SuperClass, errorCode, create, constructorArgsFromJson) {
    const createFn = create === "inherit" ? __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$functions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["identityArgs"] : create;
    const constructorArgsFromJsonFn = constructorArgsFromJson === "inherit" ? SuperClass.constructorArgsFromJson : constructorArgsFromJson;
    class KnownErrorImpl extends SuperClass {
        constructor(...args){
            super(...createFn(...args));
            this.name = `KnownError<${errorCode}>`;
            this.constructorArgs = args;
        }
        static constructorArgsFromJson(json) {
            return constructorArgsFromJsonFn(json.details);
        }
        static isInstance(error) {
            if (!KnownError.isKnownError(error)) return false;
            let current = error;
            while(true){
                current = Object.getPrototypeOf(current);
                if (!current) break;
                if ("errorCode" in current.constructor && current.constructor.errorCode === errorCode) return true;
            }
            return false;
        }
    }
    KnownErrorImpl.errorCode = errorCode;
    ;
    return KnownErrorImpl;
}
var UnsupportedError = createKnownErrorConstructor(KnownError, "UNSUPPORTED_ERROR", (originalErrorCode)=>[
        500,
        `An error occurred that is not currently supported (possibly because it was added in a version of Stack that is newer than this client). The original unsupported error code was: ${originalErrorCode}`,
        {
            originalErrorCode
        }
    ], (json)=>[
        json?.originalErrorCode ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("originalErrorCode not found in UnsupportedError details")
    ]);
var BodyParsingError = createKnownErrorConstructor(KnownError, "BODY_PARSING_ERROR", (message)=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var SchemaError = createKnownErrorConstructor(KnownError, "SCHEMA_ERROR", (message)=>[
        400,
        message || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("SchemaError requires a message"),
        {
            message
        }
    ], (json)=>[
        json.message
    ]);
var AllOverloadsFailed = createKnownErrorConstructor(KnownError, "ALL_OVERLOADS_FAILED", (overloadErrors)=>[
        400,
        __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      This endpoint has multiple overloads, but they all failed to process the request.

        ${overloadErrors.map((e, i)=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
          Overload ${i + 1}: ${JSON.stringify(e, void 0, 2)}
        `).join("\n\n")}
    `,
        {
            overload_errors: overloadErrors
        }
    ], (json)=>[
        json?.overload_errors ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("overload_errors not found in AllOverloadsFailed details")
    ]);
var ProjectAuthenticationError = createKnownErrorConstructor(KnownError, "PROJECT_AUTHENTICATION_ERROR", "inherit", "inherit");
var InvalidProjectAuthentication = createKnownErrorConstructor(ProjectAuthenticationError, "INVALID_PROJECT_AUTHENTICATION", "inherit", "inherit");
var ProjectKeyWithoutAccessType = createKnownErrorConstructor(InvalidProjectAuthentication, "PROJECT_KEY_WITHOUT_ACCESS_TYPE", ()=>[
        400,
        "Either an API key or an admin access token was provided, but the x-stack-access-type header is missing. Set it to 'client', 'server', or 'admin' as appropriate."
    ], ()=>[]);
var InvalidAccessType = createKnownErrorConstructor(InvalidProjectAuthentication, "INVALID_ACCESS_TYPE", (accessType)=>[
        400,
        `The x-stack-access-type header must be 'client', 'server', or 'admin', but was '${accessType}'.`
    ], (json)=>[
        json?.accessType ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("accessType not found in InvalidAccessType details")
    ]);
var AccessTypeWithoutProjectId = createKnownErrorConstructor(InvalidProjectAuthentication, "ACCESS_TYPE_WITHOUT_PROJECT_ID", (accessType)=>[
        400,
        __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      The x-stack-access-type header was '${accessType}', but the x-stack-project-id header was not provided.
      
      For more information, see the docs on REST API authentication: https://docs.stack-auth.com/rest-api/overview#authentication
    `,
        {
            request_type: accessType
        }
    ], (json)=>[
        json.request_type
    ]);
var AccessTypeRequired = createKnownErrorConstructor(InvalidProjectAuthentication, "ACCESS_TYPE_REQUIRED", ()=>[
        400,
        __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      You must specify an access level for this Stack project. Make sure project API keys are provided (eg. x-stack-publishable-client-key) and you set the x-stack-access-type header to 'client', 'server', or 'admin'.
      
      For more information, see the docs on REST API authentication: https://docs.stack-auth.com/rest-api/overview#authentication
    `
    ], ()=>[]);
var InsufficientAccessType = createKnownErrorConstructor(InvalidProjectAuthentication, "INSUFFICIENT_ACCESS_TYPE", (actualAccessType, allowedAccessTypes)=>[
        401,
        `The x-stack-access-type header must be ${allowedAccessTypes.map((s)=>`'${s}'`).join(" or ")}, but was '${actualAccessType}'.`,
        {
            actual_access_type: actualAccessType,
            allowed_access_types: allowedAccessTypes
        }
    ], (json)=>[
        json.actual_access_type,
        json.allowed_access_types
    ]);
var InvalidPublishableClientKey = createKnownErrorConstructor(InvalidProjectAuthentication, "INVALID_PUBLISHABLE_CLIENT_KEY", (projectId)=>[
        401,
        `The publishable key is not valid for the project ${JSON.stringify(projectId)}. Does the project and/or the key exist?`,
        {
            project_id: projectId
        }
    ], (json)=>[
        json.project_id
    ]);
var InvalidSecretServerKey = createKnownErrorConstructor(InvalidProjectAuthentication, "INVALID_SECRET_SERVER_KEY", (projectId)=>[
        401,
        `The secret server key is not valid for the project ${JSON.stringify(projectId)}. Does the project and/or the key exist?`,
        {
            project_id: projectId
        }
    ], (json)=>[
        json.project_id
    ]);
var InvalidSuperSecretAdminKey = createKnownErrorConstructor(InvalidProjectAuthentication, "INVALID_SUPER_SECRET_ADMIN_KEY", (projectId)=>[
        401,
        `The super secret admin key is not valid for the project ${JSON.stringify(projectId)}. Does the project and/or the key exist?`,
        {
            project_id: projectId
        }
    ], (json)=>[
        json.project_id
    ]);
var InvalidAdminAccessToken = createKnownErrorConstructor(InvalidProjectAuthentication, "INVALID_ADMIN_ACCESS_TOKEN", "inherit", "inherit");
var UnparsableAdminAccessToken = createKnownErrorConstructor(InvalidAdminAccessToken, "UNPARSABLE_ADMIN_ACCESS_TOKEN", ()=>[
        401,
        "Admin access token is not parsable."
    ], ()=>[]);
var AdminAccessTokenExpired = createKnownErrorConstructor(InvalidAdminAccessToken, "ADMIN_ACCESS_TOKEN_EXPIRED", (expiredAt)=>[
        401,
        `Admin access token has expired. Please refresh it and try again.${expiredAt ? ` (The access token expired at ${expiredAt.toISOString()}.)` : ""}`,
        {
            expired_at_millis: expiredAt?.getTime() ?? null
        }
    ], (json)=>[
        json.expired_at_millis ?? void 0
    ]);
var InvalidProjectForAdminAccessToken = createKnownErrorConstructor(InvalidAdminAccessToken, "INVALID_PROJECT_FOR_ADMIN_ACCESS_TOKEN", ()=>[
        401,
        "Admin access tokens must be created on the internal project."
    ], ()=>[]);
var AdminAccessTokenIsNotAdmin = createKnownErrorConstructor(InvalidAdminAccessToken, "ADMIN_ACCESS_TOKEN_IS_NOT_ADMIN", ()=>[
        401,
        "Admin access token does not have the required permissions to access this project."
    ], ()=>[]);
var ProjectAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationError, "PROJECT_AUTHENTICATION_REQUIRED", "inherit", "inherit");
var ClientAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "CLIENT_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "The publishable client key must be provided."
    ], ()=>[]);
var ServerAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "SERVER_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "The secret server key must be provided."
    ], ()=>[]);
var ClientOrServerAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "CLIENT_OR_SERVER_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "Either the publishable client key or the secret server key must be provided."
    ], ()=>[]);
var ClientOrAdminAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "CLIENT_OR_ADMIN_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "Either the publishable client key or the super secret admin key must be provided."
    ], ()=>[]);
var ClientOrServerOrAdminAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "CLIENT_OR_SERVER_OR_ADMIN_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "Either the publishable client key, the secret server key, or the super secret admin key must be provided."
    ], ()=>[]);
var AdminAuthenticationRequired = createKnownErrorConstructor(ProjectAuthenticationRequired, "ADMIN_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "The super secret admin key must be provided."
    ], ()=>[]);
var ExpectedInternalProject = createKnownErrorConstructor(ProjectAuthenticationError, "EXPECTED_INTERNAL_PROJECT", ()=>[
        401,
        "The project ID is expected to be internal."
    ], ()=>[]);
var SessionAuthenticationError = createKnownErrorConstructor(KnownError, "SESSION_AUTHENTICATION_ERROR", "inherit", "inherit");
var InvalidSessionAuthentication = createKnownErrorConstructor(SessionAuthenticationError, "INVALID_SESSION_AUTHENTICATION", "inherit", "inherit");
var InvalidAccessToken = createKnownErrorConstructor(InvalidSessionAuthentication, "INVALID_ACCESS_TOKEN", "inherit", "inherit");
var UnparsableAccessToken = createKnownErrorConstructor(InvalidAccessToken, "UNPARSABLE_ACCESS_TOKEN", ()=>[
        401,
        "Access token is not parsable."
    ], ()=>[]);
var AccessTokenExpired = createKnownErrorConstructor(InvalidAccessToken, "ACCESS_TOKEN_EXPIRED", (expiredAt)=>[
        401,
        `Access token has expired. Please refresh it and try again.${expiredAt ? ` (The access token expired at ${expiredAt.toISOString()}.)` : ""}`,
        {
            expired_at_millis: expiredAt?.getTime() ?? null
        }
    ], (json)=>[
        json.expired_at_millis ? new Date(json.expired_at_millis) : void 0
    ]);
var InvalidProjectForAccessToken = createKnownErrorConstructor(InvalidAccessToken, "INVALID_PROJECT_FOR_ACCESS_TOKEN", (expectedProjectId, actualProjectId)=>[
        401,
        `Access token not valid for this project. Expected project ID ${JSON.stringify(expectedProjectId)}, but the token is for project ID ${JSON.stringify(actualProjectId)}.`,
        {
            expected_project_id: expectedProjectId,
            actual_project_id: actualProjectId
        }
    ], (json)=>[
        json.expected_project_id,
        json.actual_project_id
    ]);
var RefreshTokenError = createKnownErrorConstructor(KnownError, "REFRESH_TOKEN_ERROR", "inherit", "inherit");
var RefreshTokenNotFoundOrExpired = createKnownErrorConstructor(RefreshTokenError, "REFRESH_TOKEN_NOT_FOUND_OR_EXPIRED", ()=>[
        401,
        "Refresh token not found for this project, or the session has expired/been revoked."
    ], ()=>[]);
var CannotDeleteCurrentSession = createKnownErrorConstructor(RefreshTokenError, "CANNOT_DELETE_CURRENT_SESSION", ()=>[
        400,
        "Cannot delete the current session."
    ], ()=>[]);
var ProviderRejected = createKnownErrorConstructor(RefreshTokenError, "PROVIDER_REJECTED", ()=>[
        401,
        "The provider refused to refresh their token. This usually means that the provider used to authenticate the user no longer regards this session as valid, and the user must re-authenticate."
    ], ()=>[]);
var UserWithEmailAlreadyExists = createKnownErrorConstructor(KnownError, "USER_EMAIL_ALREADY_EXISTS", (email, wouldWorkIfEmailWasVerified = false)=>[
        409,
        `A user with email ${JSON.stringify(email)} already exists${wouldWorkIfEmailWasVerified ? " but the email is not verified. Please login to your existing account with the method you used to sign up, and then verify your email to sign in with this login method." : "."}`,
        {
            email,
            would_work_if_email_was_verified: wouldWorkIfEmailWasVerified
        }
    ], (json)=>[
        json.email,
        json.would_work_if_email_was_verified ?? false
    ]);
var EmailNotVerified = createKnownErrorConstructor(KnownError, "EMAIL_NOT_VERIFIED", ()=>[
        400,
        "The email is not verified."
    ], ()=>[]);
var CannotGetOwnUserWithoutUser = createKnownErrorConstructor(KnownError, "CANNOT_GET_OWN_USER_WITHOUT_USER", ()=>[
        400,
        "You have specified 'me' as a userId, but did not provide authentication for a user."
    ], ()=>[]);
var UserIdDoesNotExist = createKnownErrorConstructor(KnownError, "USER_ID_DOES_NOT_EXIST", (userId)=>[
        400,
        `The given user with the ID ${userId} does not exist.`,
        {
            user_id: userId
        }
    ], (json)=>[
        json.user_id
    ]);
var UserNotFound = createKnownErrorConstructor(KnownError, "USER_NOT_FOUND", ()=>[
        404,
        "User not found."
    ], ()=>[]);
var ProjectNotFound = createKnownErrorConstructor(KnownError, "PROJECT_NOT_FOUND", (projectId)=>{
    if (typeof projectId !== "string") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("projectId of KnownErrors.ProjectNotFound must be a string");
    return [
        404,
        `Project ${projectId} not found or is not accessible with the current user.`,
        {
            project_id: projectId
        }
    ];
}, (json)=>[
        json.project_id
    ]);
var CurrentProjectNotFound = createKnownErrorConstructor(KnownError, "CURRENT_PROJECT_NOT_FOUND", (projectId)=>[
        400,
        `The current project with ID ${projectId} was not found. Please check the value of the x-stack-project-id header.`,
        {
            project_id: projectId
        }
    ], (json)=>[
        json.project_id
    ]);
var BranchDoesNotExist = createKnownErrorConstructor(KnownError, "BRANCH_DOES_NOT_EXIST", (branchId)=>[
        400,
        `The branch with ID ${branchId} does not exist.`,
        {
            branch_id: branchId
        }
    ], (json)=>[
        json.branch_id
    ]);
var SignUpNotEnabled = createKnownErrorConstructor(KnownError, "SIGN_UP_NOT_ENABLED", ()=>[
        400,
        "Creation of new accounts is not enabled for this project. Please ask the project owner to enable it."
    ], ()=>[]);
var PasswordAuthenticationNotEnabled = createKnownErrorConstructor(KnownError, "PASSWORD_AUTHENTICATION_NOT_ENABLED", ()=>[
        400,
        "Password authentication is not enabled for this project."
    ], ()=>[]);
var DataVaultStoreDoesNotExist = createKnownErrorConstructor(KnownError, "DATA_VAULT_STORE_DOES_NOT_EXIST", (storeId)=>[
        400,
        `Data vault store with ID ${storeId} does not exist.`,
        {
            store_id: storeId
        }
    ], (json)=>[
        json.store_id
    ]);
var DataVaultStoreHashedKeyDoesNotExist = createKnownErrorConstructor(KnownError, "DATA_VAULT_STORE_HASHED_KEY_DOES_NOT_EXIST", (storeId, hashedKey)=>[
        400,
        `Data vault store with ID ${storeId} does not contain a key with hash ${hashedKey}.`,
        {
            store_id: storeId,
            hashed_key: hashedKey
        }
    ], (json)=>[
        json.store_id,
        json.hashed_key
    ]);
var PasskeyAuthenticationNotEnabled = createKnownErrorConstructor(KnownError, "PASSKEY_AUTHENTICATION_NOT_ENABLED", ()=>[
        400,
        "Passkey authentication is not enabled for this project."
    ], ()=>[]);
var AnonymousAccountsNotEnabled = createKnownErrorConstructor(KnownError, "ANONYMOUS_ACCOUNTS_NOT_ENABLED", ()=>[
        400,
        "Anonymous accounts are not enabled for this project."
    ], ()=>[]);
var AnonymousAuthenticationNotAllowed = createKnownErrorConstructor(KnownError, "ANONYMOUS_AUTHENTICATION_NOT_ALLOWED", ()=>[
        401,
        "X-Stack-Access-Token is for an anonymous user, but anonymous users are not enabled. Set the X-Stack-Allow-Anonymous-User header of this request to 'true' to allow anonymous users."
    ], ()=>[]);
var EmailPasswordMismatch = createKnownErrorConstructor(KnownError, "EMAIL_PASSWORD_MISMATCH", ()=>[
        400,
        "Wrong e-mail or password."
    ], ()=>[]);
var RedirectUrlNotWhitelisted = createKnownErrorConstructor(KnownError, "REDIRECT_URL_NOT_WHITELISTED", ()=>[
        400,
        "Redirect URL not whitelisted. Did you forget to add this domain to the trusted domains list on the Stack Auth dashboard?"
    ], ()=>[]);
var PasswordRequirementsNotMet = createKnownErrorConstructor(KnownError, "PASSWORD_REQUIREMENTS_NOT_MET", "inherit", "inherit");
var PasswordTooShort = createKnownErrorConstructor(PasswordRequirementsNotMet, "PASSWORD_TOO_SHORT", (minLength)=>[
        400,
        `Password too short. Minimum length is ${minLength}.`,
        {
            min_length: minLength
        }
    ], (json)=>[
        json?.min_length ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("min_length not found in PasswordTooShort details")
    ]);
var PasswordTooLong = createKnownErrorConstructor(PasswordRequirementsNotMet, "PASSWORD_TOO_LONG", (maxLength)=>[
        400,
        `Password too long. Maximum length is ${maxLength}.`,
        {
            maxLength
        }
    ], (json)=>[
        json?.maxLength ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("maxLength not found in PasswordTooLong details")
    ]);
var UserDoesNotHavePassword = createKnownErrorConstructor(KnownError, "USER_DOES_NOT_HAVE_PASSWORD", ()=>[
        400,
        "This user does not have password authentication enabled."
    ], ()=>[]);
var VerificationCodeError = createKnownErrorConstructor(KnownError, "VERIFICATION_ERROR", "inherit", "inherit");
var VerificationCodeNotFound = createKnownErrorConstructor(VerificationCodeError, "VERIFICATION_CODE_NOT_FOUND", ()=>[
        404,
        "The verification code does not exist for this project."
    ], ()=>[]);
var VerificationCodeExpired = createKnownErrorConstructor(VerificationCodeError, "VERIFICATION_CODE_EXPIRED", ()=>[
        400,
        "The verification code has expired."
    ], ()=>[]);
var VerificationCodeAlreadyUsed = createKnownErrorConstructor(VerificationCodeError, "VERIFICATION_CODE_ALREADY_USED", ()=>[
        409,
        "The verification link has already been used."
    ], ()=>[]);
var VerificationCodeMaxAttemptsReached = createKnownErrorConstructor(VerificationCodeError, "VERIFICATION_CODE_MAX_ATTEMPTS_REACHED", ()=>[
        400,
        "The verification code nonce has reached the maximum number of attempts. This code is not valid anymore."
    ], ()=>[]);
var PasswordConfirmationMismatch = createKnownErrorConstructor(KnownError, "PASSWORD_CONFIRMATION_MISMATCH", ()=>[
        400,
        "Passwords do not match."
    ], ()=>[]);
var EmailAlreadyVerified = createKnownErrorConstructor(KnownError, "EMAIL_ALREADY_VERIFIED", ()=>[
        409,
        "The e-mail is already verified."
    ], ()=>[]);
var EmailNotAssociatedWithUser = createKnownErrorConstructor(KnownError, "EMAIL_NOT_ASSOCIATED_WITH_USER", ()=>[
        400,
        "The e-mail is not associated with a user that could log in with that e-mail."
    ], ()=>[]);
var EmailIsNotPrimaryEmail = createKnownErrorConstructor(KnownError, "EMAIL_IS_NOT_PRIMARY_EMAIL", (email, primaryEmail)=>[
        400,
        `The given e-mail (${email}) must equal the user's primary e-mail (${primaryEmail}).`,
        {
            email,
            primary_email: primaryEmail
        }
    ], (json)=>[
        json.email,
        json.primary_email
    ]);
var PasskeyRegistrationFailed = createKnownErrorConstructor(KnownError, "PASSKEY_REGISTRATION_FAILED", (message)=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var PasskeyWebAuthnError = createKnownErrorConstructor(KnownError, "PASSKEY_WEBAUTHN_ERROR", (message, code)=>[
        400,
        message,
        {
            message,
            code
        }
    ], (json)=>[
        json.message,
        json.code
    ]);
var PasskeyAuthenticationFailed = createKnownErrorConstructor(KnownError, "PASSKEY_AUTHENTICATION_FAILED", (message)=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var PermissionNotFound = createKnownErrorConstructor(KnownError, "PERMISSION_NOT_FOUND", (permissionId)=>[
        404,
        `Permission "${permissionId}" not found. Make sure you created it on the dashboard.`,
        {
            permission_id: permissionId
        }
    ], (json)=>[
        json.permission_id
    ]);
var PermissionScopeMismatch = createKnownErrorConstructor(KnownError, "WRONG_PERMISSION_SCOPE", (permissionId, expectedScope, actualScope)=>[
        404,
        `Permission ${JSON.stringify(permissionId)} not found. (It was found for a different scope ${JSON.stringify(actualScope)}, but scope ${JSON.stringify(expectedScope)} was expected.)`,
        {
            permission_id: permissionId,
            expected_scope: expectedScope,
            actual_scope: actualScope
        }
    ], (json)=>[
        json.permission_id,
        json.expected_scope,
        json.actual_scope
    ]);
var ContainedPermissionNotFound = createKnownErrorConstructor(KnownError, "CONTAINED_PERMISSION_NOT_FOUND", (permissionId)=>[
        400,
        `Contained permission with ID "${permissionId}" not found. Make sure you created it on the dashboard.`,
        {
            permission_id: permissionId
        }
    ], (json)=>[
        json.permission_id
    ]);
var TeamNotFound = createKnownErrorConstructor(KnownError, "TEAM_NOT_FOUND", (teamId)=>[
        404,
        `Team ${teamId} not found.`,
        {
            team_id: teamId
        }
    ], (json)=>[
        json.team_id
    ]);
var TeamAlreadyExists = createKnownErrorConstructor(KnownError, "TEAM_ALREADY_EXISTS", (teamId)=>[
        409,
        `Team ${teamId} already exists.`,
        {
            team_id: teamId
        }
    ], (json)=>[
        json.team_id
    ]);
var TeamMembershipNotFound = createKnownErrorConstructor(KnownError, "TEAM_MEMBERSHIP_NOT_FOUND", (teamId, userId)=>[
        404,
        `User ${userId} is not found in team ${teamId}.`,
        {
            team_id: teamId,
            user_id: userId
        }
    ], (json)=>[
        json.team_id,
        json.user_id
    ]);
var EmailTemplateAlreadyExists = createKnownErrorConstructor(KnownError, "EMAIL_TEMPLATE_ALREADY_EXISTS", ()=>[
        409,
        "Email template already exists."
    ], ()=>[]);
var OAuthConnectionNotConnectedToUser = createKnownErrorConstructor(KnownError, "OAUTH_CONNECTION_NOT_CONNECTED_TO_USER", ()=>[
        400,
        "The OAuth connection is not connected to any user."
    ], ()=>[]);
var OAuthConnectionAlreadyConnectedToAnotherUser = createKnownErrorConstructor(KnownError, "OAUTH_CONNECTION_ALREADY_CONNECTED_TO_ANOTHER_USER", ()=>[
        409,
        "The OAuth connection is already connected to another user."
    ], ()=>[]);
var OAuthConnectionDoesNotHaveRequiredScope = createKnownErrorConstructor(KnownError, "OAUTH_CONNECTION_DOES_NOT_HAVE_REQUIRED_SCOPE", ()=>[
        400,
        "The OAuth connection does not have the required scope."
    ], ()=>[]);
var OAuthExtraScopeNotAvailableWithSharedOAuthKeys = createKnownErrorConstructor(KnownError, "OAUTH_EXTRA_SCOPE_NOT_AVAILABLE_WITH_SHARED_OAUTH_KEYS", ()=>[
        400,
        "Extra scopes are not available with shared OAuth keys. Please add your own OAuth keys on the Stack dashboard to use extra scopes."
    ], ()=>[]);
var OAuthAccessTokenNotAvailableWithSharedOAuthKeys = createKnownErrorConstructor(KnownError, "OAUTH_ACCESS_TOKEN_NOT_AVAILABLE_WITH_SHARED_OAUTH_KEYS", ()=>[
        400,
        "Access tokens are not available with shared OAuth keys. Please add your own OAuth keys on the Stack dashboard to use access tokens."
    ], ()=>[]);
var InvalidOAuthClientIdOrSecret = createKnownErrorConstructor(KnownError, "INVALID_OAUTH_CLIENT_ID_OR_SECRET", (clientId)=>[
        400,
        "The OAuth client ID or secret is invalid. The client ID must be equal to the project ID (potentially with a hash and a branch ID), and the client secret must be a publishable client key.",
        {
            client_id: clientId ?? null
        }
    ], (json)=>[
        json.client_id ?? void 0
    ]);
var InvalidScope = createKnownErrorConstructor(KnownError, "INVALID_SCOPE", (scope)=>[
        400,
        `The scope "${scope}" is not a valid OAuth scope for Stack.`
    ], (json)=>[
        json.scope
    ]);
var UserAlreadyConnectedToAnotherOAuthConnection = createKnownErrorConstructor(KnownError, "USER_ALREADY_CONNECTED_TO_ANOTHER_OAUTH_CONNECTION", ()=>[
        409,
        "The user is already connected to another OAuth account. Did you maybe selected the wrong account?"
    ], ()=>[]);
var OuterOAuthTimeout = createKnownErrorConstructor(KnownError, "OUTER_OAUTH_TIMEOUT", ()=>[
        408,
        "The OAuth flow has timed out. Please sign in again."
    ], ()=>[]);
var OAuthProviderNotFoundOrNotEnabled = createKnownErrorConstructor(KnownError, "OAUTH_PROVIDER_NOT_FOUND_OR_NOT_ENABLED", ()=>[
        400,
        "The OAuth provider is not found or not enabled."
    ], ()=>[]);
var OAuthProviderAccountIdAlreadyUsedForSignIn = createKnownErrorConstructor(KnownError, "OAUTH_PROVIDER_ACCOUNT_ID_ALREADY_USED_FOR_SIGN_IN", ()=>[
        400,
        `A provider with the same account ID is already used for signing in.`
    ], ()=>[]);
var MultiFactorAuthenticationRequired = createKnownErrorConstructor(KnownError, "MULTI_FACTOR_AUTHENTICATION_REQUIRED", (attemptCode)=>[
        400,
        `Multi-factor authentication is required for this user.`,
        {
            attempt_code: attemptCode
        }
    ], (json)=>[
        json.attempt_code
    ]);
var InvalidTotpCode = createKnownErrorConstructor(KnownError, "INVALID_TOTP_CODE", ()=>[
        400,
        "The TOTP code is invalid. Please try again."
    ], ()=>[]);
var UserAuthenticationRequired = createKnownErrorConstructor(KnownError, "USER_AUTHENTICATION_REQUIRED", ()=>[
        401,
        "User authentication required for this endpoint."
    ], ()=>[]);
var TeamMembershipAlreadyExists = createKnownErrorConstructor(KnownError, "TEAM_MEMBERSHIP_ALREADY_EXISTS", ()=>[
        409,
        "Team membership already exists."
    ], ()=>[]);
var ProjectPermissionRequired = createKnownErrorConstructor(KnownError, "PROJECT_PERMISSION_REQUIRED", (userId, permissionId)=>[
        401,
        `User ${userId} does not have permission ${permissionId}.`,
        {
            user_id: userId,
            permission_id: permissionId
        }
    ], (json)=>[
        json.user_id,
        json.permission_id
    ]);
var TeamPermissionRequired = createKnownErrorConstructor(KnownError, "TEAM_PERMISSION_REQUIRED", (teamId, userId, permissionId)=>[
        401,
        `User ${userId} does not have permission ${permissionId} in team ${teamId}.`,
        {
            team_id: teamId,
            user_id: userId,
            permission_id: permissionId
        }
    ], (json)=>[
        json.team_id,
        json.user_id,
        json.permission_id
    ]);
var TeamPermissionNotFound = createKnownErrorConstructor(KnownError, "TEAM_PERMISSION_NOT_FOUND", (teamId, userId, permissionId)=>[
        401,
        `User ${userId} does not have permission ${permissionId} in team ${teamId}.`,
        {
            team_id: teamId,
            user_id: userId,
            permission_id: permissionId
        }
    ], (json)=>[
        json.team_id,
        json.user_id,
        json.permission_id
    ]);
var InvalidSharedOAuthProviderId = createKnownErrorConstructor(KnownError, "INVALID_SHARED_OAUTH_PROVIDER_ID", (providerId)=>[
        400,
        `The shared OAuth provider with ID ${providerId} is not valid.`,
        {
            provider_id: providerId
        }
    ], (json)=>[
        json.provider_id
    ]);
var InvalidStandardOAuthProviderId = createKnownErrorConstructor(KnownError, "INVALID_STANDARD_OAUTH_PROVIDER_ID", (providerId)=>[
        400,
        `The standard OAuth provider with ID ${providerId} is not valid.`,
        {
            provider_id: providerId
        }
    ], (json)=>[
        json.provider_id
    ]);
var InvalidAuthorizationCode = createKnownErrorConstructor(KnownError, "INVALID_AUTHORIZATION_CODE", ()=>[
        400,
        "The given authorization code is invalid."
    ], ()=>[]);
var OAuthProviderAccessDenied = createKnownErrorConstructor(KnownError, "OAUTH_PROVIDER_ACCESS_DENIED", ()=>[
        400,
        "The OAuth provider denied access to the user."
    ], ()=>[]);
var ContactChannelAlreadyUsedForAuthBySomeoneElse = createKnownErrorConstructor(KnownError, "CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE", (type, contactChannelValue, wouldWorkIfEmailWasVerified = false)=>[
        409,
        `This ${type} ${contactChannelValue ? `"(${contactChannelValue})"` : ""} is already used for authentication by another account${wouldWorkIfEmailWasVerified ? " but the email is not verified. Please login to your existing account with the method you used to sign up, and then verify your email to sign in with this login method." : "."}`,
        {
            type,
            contact_channel_value: contactChannelValue ?? null,
            would_work_if_email_was_verified: wouldWorkIfEmailWasVerified
        }
    ], (json)=>[
        json.type,
        json.contact_channel_value,
        json.would_work_if_email_was_verified ?? false
    ]);
var InvalidPollingCodeError = createKnownErrorConstructor(KnownError, "INVALID_POLLING_CODE", (details)=>[
        400,
        "The polling code is invalid or does not exist.",
        details
    ], (json)=>[
        json
    ]);
var CliAuthError = createKnownErrorConstructor(KnownError, "CLI_AUTH_ERROR", (message)=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var CliAuthExpiredError = createKnownErrorConstructor(KnownError, "CLI_AUTH_EXPIRED_ERROR", (message = "CLI authentication request expired. Please try again.")=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var CliAuthUsedError = createKnownErrorConstructor(KnownError, "CLI_AUTH_USED_ERROR", (message = "This authentication token has already been used.")=>[
        400,
        message
    ], (json)=>[
        json.message
    ]);
var ApiKeyNotValid = createKnownErrorConstructor(KnownError, "API_KEY_NOT_VALID", "inherit", "inherit");
var ApiKeyExpired = createKnownErrorConstructor(ApiKeyNotValid, "API_KEY_EXPIRED", ()=>[
        401,
        "API key has expired."
    ], ()=>[]);
var ApiKeyRevoked = createKnownErrorConstructor(ApiKeyNotValid, "API_KEY_REVOKED", ()=>[
        401,
        "API key has been revoked."
    ], ()=>[]);
var WrongApiKeyType = createKnownErrorConstructor(ApiKeyNotValid, "WRONG_API_KEY_TYPE", (expectedType, actualType)=>[
        400,
        `This endpoint is for ${expectedType} API keys, but a ${actualType} API key was provided.`,
        {
            expected_type: expectedType,
            actual_type: actualType
        }
    ], (json)=>[
        json.expected_type,
        json.actual_type
    ]);
var ApiKeyNotFound = createKnownErrorConstructor(ApiKeyNotValid, "API_KEY_NOT_FOUND", ()=>[
        404,
        "API key not found."
    ], ()=>[]);
var PublicApiKeyCannotBeRevoked = createKnownErrorConstructor(ApiKeyNotValid, "PUBLIC_API_KEY_CANNOT_BE_REVOKED", ()=>[
        400,
        "Public API keys cannot be revoked by the secretscanner endpoint."
    ], ()=>[]);
var PermissionIdAlreadyExists = createKnownErrorConstructor(KnownError, "PERMISSION_ID_ALREADY_EXISTS", (permissionId)=>[
        400,
        `Permission with ID "${permissionId}" already exists. Choose a different ID.`,
        {
            permission_id: permissionId
        }
    ], (json)=>[
        json.permission_id
    ]);
var EmailRenderingError = createKnownErrorConstructor(KnownError, "EMAIL_RENDERING_ERROR", (error)=>[
        400,
        `Failed to render email with theme: ${error}`,
        {
            error
        }
    ], (json)=>[
        json.error
    ]);
var RequiresCustomEmailServer = createKnownErrorConstructor(KnownError, "REQUIRES_CUSTOM_EMAIL_SERVER", ()=>[
        400,
        `This action requires a custom SMTP server. Please edit your email server configuration and try again.`
    ], ()=>[]);
var ItemNotFound = createKnownErrorConstructor(KnownError, "ITEM_NOT_FOUND", (itemId)=>[
        404,
        `Item with ID "${itemId}" not found.`,
        {
            item_id: itemId
        }
    ], (json)=>[
        json.item_id
    ]);
var ItemCustomerTypeDoesNotMatch = createKnownErrorConstructor(KnownError, "ITEM_CUSTOMER_TYPE_DOES_NOT_MATCH", (itemId, customerId, itemCustomerType, actualCustomerType)=>[
        400,
        `The ${actualCustomerType} with ID ${JSON.stringify(customerId)} is not a valid customer for the item with ID ${JSON.stringify(itemId)}. ${itemCustomerType ? `The item is configured to only be available for ${itemCustomerType} customers, but the customer is a ${actualCustomerType}.` : `The item is missing a customer type field. Please make sure it is set up correctly in your project configuration.`}`,
        {
            item_id: itemId,
            customer_id: customerId,
            item_customer_type: itemCustomerType ?? null,
            actual_customer_type: actualCustomerType
        }
    ], (json)=>[
        json.item_id,
        json.customer_id,
        json.item_customer_type ?? void 0,
        json.actual_customer_type
    ]);
var CustomerDoesNotExist = createKnownErrorConstructor(KnownError, "CUSTOMER_DOES_NOT_EXIST", (customerId)=>[
        400,
        `Customer with ID ${JSON.stringify(customerId)} does not exist.`,
        {
            customer_id: customerId
        }
    ], (json)=>[
        json.customer_id
    ]);
var ProductDoesNotExist = createKnownErrorConstructor(KnownError, "PRODUCT_DOES_NOT_EXIST", (productId, context)=>[
        400,
        `Product with ID ${JSON.stringify(productId)} ${context === "server_only" ? "is marked as server-only and cannot be accessed client side." : context === "item_exists" ? "does not exist, but an item with this ID exists." : "does not exist."}`,
        {
            product_id: productId,
            context
        }
    ], (json)=>[
        json.product_id,
        json.context
    ]);
var ProductCustomerTypeDoesNotMatch = createKnownErrorConstructor(KnownError, "PRODUCT_CUSTOMER_TYPE_DOES_NOT_MATCH", (productId, customerId, productCustomerType, actualCustomerType)=>[
        400,
        `The ${actualCustomerType} with ID ${JSON.stringify(customerId)} is not a valid customer for the inline product that has been passed in. ${productCustomerType ? `The product is configured to only be available for ${productCustomerType} customers, but the customer is a ${actualCustomerType}.` : `The product is missing a customer type field. Please make sure it is set up correctly in your project configuration.`}`,
        {
            product_id: productId ?? null,
            customer_id: customerId,
            product_customer_type: productCustomerType ?? null,
            actual_customer_type: actualCustomerType
        }
    ], (json)=>[
        json.product_id ?? void 0,
        json.customer_id,
        json.product_customer_type ?? void 0,
        json.actual_customer_type
    ]);
var ProductAlreadyGranted = createKnownErrorConstructor(KnownError, "PRODUCT_ALREADY_GRANTED", (productId, customerId)=>[
        400,
        `Customer with ID ${JSON.stringify(customerId)} already owns product ${JSON.stringify(productId)}.`,
        {
            product_id: productId,
            customer_id: customerId
        }
    ], (json)=>[
        json.product_id,
        json.customer_id
    ]);
var ItemQuantityInsufficientAmount = createKnownErrorConstructor(KnownError, "ITEM_QUANTITY_INSUFFICIENT_AMOUNT", (itemId, customerId, quantity)=>[
        400,
        `The item with ID ${JSON.stringify(itemId)} has an insufficient quantity for the customer with ID ${JSON.stringify(customerId)}. An attempt was made to charge ${quantity} credits.`,
        {
            item_id: itemId,
            customer_id: customerId,
            quantity
        }
    ], (json)=>[
        json.item_id,
        json.customer_id,
        json.quantity
    ]);
var StripeAccountInfoNotFound = createKnownErrorConstructor(KnownError, "STRIPE_ACCOUNT_INFO_NOT_FOUND", ()=>[
        404,
        "Stripe account information not found. Please make sure the user has onboarded with Stripe."
    ], ()=>[]);
var WorkflowTokenDoesNotExist = createKnownErrorConstructor(KnownError, "WORKFLOW_TOKEN_DOES_NOT_EXIST", ()=>[
        400,
        "The workflow token you specified does not exist. Make sure the value in x-stack-workflow-token is correct."
    ], ()=>[]);
var WorkflowTokenExpired = createKnownErrorConstructor(KnownError, "WORKFLOW_TOKEN_EXPIRED", ()=>[
        400,
        "The workflow token you specified has expired. Make sure the value in x-stack-workflow-token is correct."
    ], ()=>[]);
var KnownErrors = {
    CannotDeleteCurrentSession,
    UnsupportedError,
    BodyParsingError,
    SchemaError,
    AllOverloadsFailed,
    ProjectAuthenticationError,
    PermissionIdAlreadyExists,
    CliAuthError,
    CliAuthExpiredError,
    CliAuthUsedError,
    InvalidProjectAuthentication,
    ProjectKeyWithoutAccessType,
    InvalidAccessType,
    AccessTypeWithoutProjectId,
    AccessTypeRequired,
    CannotGetOwnUserWithoutUser,
    InsufficientAccessType,
    InvalidPublishableClientKey,
    InvalidSecretServerKey,
    InvalidSuperSecretAdminKey,
    InvalidAdminAccessToken,
    UnparsableAdminAccessToken,
    AdminAccessTokenExpired,
    InvalidProjectForAdminAccessToken,
    AdminAccessTokenIsNotAdmin,
    ProjectAuthenticationRequired,
    ClientAuthenticationRequired,
    ServerAuthenticationRequired,
    ClientOrServerAuthenticationRequired,
    ClientOrAdminAuthenticationRequired,
    ClientOrServerOrAdminAuthenticationRequired,
    AdminAuthenticationRequired,
    ExpectedInternalProject,
    SessionAuthenticationError,
    InvalidSessionAuthentication,
    InvalidAccessToken,
    UnparsableAccessToken,
    AccessTokenExpired,
    InvalidProjectForAccessToken,
    RefreshTokenError,
    ProviderRejected,
    RefreshTokenNotFoundOrExpired,
    UserWithEmailAlreadyExists,
    EmailNotVerified,
    UserIdDoesNotExist,
    UserNotFound,
    ApiKeyNotFound,
    PublicApiKeyCannotBeRevoked,
    ProjectNotFound,
    CurrentProjectNotFound,
    BranchDoesNotExist,
    SignUpNotEnabled,
    PasswordAuthenticationNotEnabled,
    PasskeyAuthenticationNotEnabled,
    AnonymousAccountsNotEnabled,
    AnonymousAuthenticationNotAllowed,
    EmailPasswordMismatch,
    RedirectUrlNotWhitelisted,
    PasswordRequirementsNotMet,
    PasswordTooShort,
    PasswordTooLong,
    UserDoesNotHavePassword,
    VerificationCodeError,
    VerificationCodeNotFound,
    VerificationCodeExpired,
    VerificationCodeAlreadyUsed,
    VerificationCodeMaxAttemptsReached,
    PasswordConfirmationMismatch,
    EmailAlreadyVerified,
    EmailNotAssociatedWithUser,
    EmailIsNotPrimaryEmail,
    PasskeyRegistrationFailed,
    PasskeyWebAuthnError,
    PasskeyAuthenticationFailed,
    PermissionNotFound,
    PermissionScopeMismatch,
    ContainedPermissionNotFound,
    TeamNotFound,
    TeamMembershipNotFound,
    EmailTemplateAlreadyExists,
    OAuthConnectionNotConnectedToUser,
    OAuthConnectionAlreadyConnectedToAnotherUser,
    OAuthConnectionDoesNotHaveRequiredScope,
    OAuthExtraScopeNotAvailableWithSharedOAuthKeys,
    OAuthAccessTokenNotAvailableWithSharedOAuthKeys,
    InvalidOAuthClientIdOrSecret,
    InvalidScope,
    UserAlreadyConnectedToAnotherOAuthConnection,
    OuterOAuthTimeout,
    OAuthProviderNotFoundOrNotEnabled,
    OAuthProviderAccountIdAlreadyUsedForSignIn,
    MultiFactorAuthenticationRequired,
    InvalidTotpCode,
    UserAuthenticationRequired,
    TeamMembershipAlreadyExists,
    ProjectPermissionRequired,
    TeamPermissionRequired,
    InvalidSharedOAuthProviderId,
    InvalidStandardOAuthProviderId,
    InvalidAuthorizationCode,
    TeamPermissionNotFound,
    OAuthProviderAccessDenied,
    ContactChannelAlreadyUsedForAuthBySomeoneElse,
    InvalidPollingCodeError,
    ApiKeyNotValid,
    ApiKeyExpired,
    ApiKeyRevoked,
    WrongApiKeyType,
    EmailRenderingError,
    RequiresCustomEmailServer,
    ItemNotFound,
    ItemCustomerTypeDoesNotMatch,
    CustomerDoesNotExist,
    ProductDoesNotExist,
    ProductCustomerTypeDoesNotMatch,
    ProductAlreadyGranted,
    ItemQuantityInsufficientAmount,
    StripeAccountInfoNotFound,
    DataVaultStoreDoesNotExist,
    DataVaultStoreHashedKeyDoesNotExist,
    WorkflowTokenDoesNotExist,
    WorkflowTokenExpired
};
var knownErrorCodes = /* @__PURE__ */ new Set();
for (const [_, KnownError2] of Object.entries(KnownErrors)){
    if (knownErrorCodes.has(KnownError2.errorCode)) {
        throw new Error(`Duplicate known error code: ${KnownError2.errorCode}`);
    }
    knownErrorCodes.add(KnownError2.errorCode);
}
;
 //# sourceMappingURL=known-errors.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/maps.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/maps.tsx
__turbopack_context__.s([
    "DependenciesMap",
    ()=>DependenciesMap,
    "IterableWeakMap",
    ()=>IterableWeakMap,
    "MaybeWeakMap",
    ()=>MaybeWeakMap,
    "WeakRefIfAvailable",
    ()=>WeakRefIfAvailable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
;
var WeakRefIfAvailable = class {
    constructor(value){
        if (typeof WeakRef === "undefined") {
            this._ref = {
                deref: ()=>value
            };
        } else {
            this._ref = new WeakRef(value);
        }
    }
    deref() {
        return this._ref.deref();
    }
};
var _a, _b;
var IterableWeakMap = class {
    constructor(entries){
        this[_a] = "IterableWeakMap";
        const mappedEntries = entries?.map((e)=>[
                e[0],
                {
                    value: e[1],
                    keyRef: new WeakRefIfAvailable(e[0])
                }
            ]);
        this._weakMap = new WeakMap(mappedEntries ?? []);
        this._keyRefs = new Set(mappedEntries?.map((e)=>e[1].keyRef) ?? []);
    }
    get(key) {
        return this._weakMap.get(key)?.value;
    }
    set(key, value) {
        const existing = this._weakMap.get(key);
        const updated = {
            value,
            keyRef: existing?.keyRef ?? new WeakRefIfAvailable(key)
        };
        this._weakMap.set(key, updated);
        this._keyRefs.add(updated.keyRef);
        return this;
    }
    delete(key) {
        const res = this._weakMap.get(key);
        if (res) {
            this._weakMap.delete(key);
            this._keyRefs.delete(res.keyRef);
            return true;
        }
        return false;
    }
    has(key) {
        return this._weakMap.has(key) && this._keyRefs.has(this._weakMap.get(key).keyRef);
    }
    *[(_b = Symbol.iterator, _a = Symbol.toStringTag, _b)]() {
        for (const keyRef of this._keyRefs){
            const key = keyRef.deref();
            const existing = key ? this._weakMap.get(key) : void 0;
            if (!key) {
                this._keyRefs.delete(keyRef);
            } else if (existing) {
                yield [
                    key,
                    existing.value
                ];
            }
        }
    }
};
var _a2, _b2;
var MaybeWeakMap = class {
    constructor(entries){
        this[_a2] = "MaybeWeakMap";
        const entriesArray = [
            ...entries ?? []
        ];
        this._primitiveMap = new Map(entriesArray.filter((e)=>!this._isAllowedInWeakMap(e[0])));
        this._weakMap = new IterableWeakMap(entriesArray.filter((e)=>this._isAllowedInWeakMap(e[0])));
    }
    _isAllowedInWeakMap(key) {
        return typeof key === "object" && key !== null || typeof key === "symbol" && Symbol.keyFor(key) === void 0;
    }
    get(key) {
        if (this._isAllowedInWeakMap(key)) {
            return this._weakMap.get(key);
        } else {
            return this._primitiveMap.get(key);
        }
    }
    set(key, value) {
        if (this._isAllowedInWeakMap(key)) {
            this._weakMap.set(key, value);
        } else {
            this._primitiveMap.set(key, value);
        }
        return this;
    }
    delete(key) {
        if (this._isAllowedInWeakMap(key)) {
            return this._weakMap.delete(key);
        } else {
            return this._primitiveMap.delete(key);
        }
    }
    has(key) {
        if (this._isAllowedInWeakMap(key)) {
            return this._weakMap.has(key);
        } else {
            return this._primitiveMap.has(key);
        }
    }
    *[(_b2 = Symbol.iterator, _a2 = Symbol.toStringTag, _b2)]() {
        yield* this._primitiveMap;
        yield* this._weakMap;
    }
};
var _a3, _b3;
var DependenciesMap = class {
    constructor(){
        this._inner = {
            map: new MaybeWeakMap(),
            hasValue: false,
            value: void 0
        };
        this[_a3] = "DependenciesMap";
    }
    _valueToResult(inner) {
        if (inner.hasValue) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(inner.value);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(void 0);
        }
    }
    _unwrapFromInner(dependencies, inner) {
        if (dependencies.length === 0) {
            return this._valueToResult(inner);
        } else {
            const [key, ...rest] = dependencies;
            const newInner = inner.map.get(key);
            if (!newInner) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(void 0);
            }
            return this._unwrapFromInner(rest, newInner);
        }
    }
    _setInInner(dependencies, value, inner) {
        if (dependencies.length === 0) {
            const res = this._valueToResult(inner);
            if (value.status === "ok") {
                inner.hasValue = true;
                inner.value = value.data;
            } else {
                inner.hasValue = false;
                inner.value = void 0;
            }
            return res;
        } else {
            const [key, ...rest] = dependencies;
            let newInner = inner.map.get(key);
            if (!newInner) {
                inner.map.set(key, newInner = {
                    map: new MaybeWeakMap(),
                    hasValue: false,
                    value: void 0
                });
            }
            return this._setInInner(rest, value, newInner);
        }
    }
    *_iterateInner(dependencies, inner) {
        if (inner.hasValue) {
            yield [
                dependencies,
                inner.value
            ];
        }
        for (const [key, value] of inner.map){
            yield* this._iterateInner([
                ...dependencies,
                key
            ], value);
        }
    }
    get(dependencies) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].or(this._unwrapFromInner(dependencies, this._inner), void 0);
    }
    set(dependencies, value) {
        this._setInInner(dependencies, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(value), this._inner);
        return this;
    }
    delete(dependencies) {
        return this._setInInner(dependencies, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(void 0), this._inner).status === "ok";
    }
    has(dependencies) {
        return this._unwrapFromInner(dependencies, this._inner).status === "ok";
    }
    clear() {
        this._inner = {
            map: new MaybeWeakMap(),
            hasValue: false,
            value: void 0
        };
    }
    *[(_b3 = Symbol.iterator, _a3 = Symbol.toStringTag, _b3)]() {
        yield* this._iterateInner([], this._inner);
    }
};
;
 //# sourceMappingURL=maps.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/bytes.tsx
__turbopack_context__.s([
    "decodeBase32",
    ()=>decodeBase32,
    "decodeBase64",
    ()=>decodeBase64,
    "decodeBase64OrBase64Url",
    ()=>decodeBase64OrBase64Url,
    "decodeBase64Url",
    ()=>decodeBase64Url,
    "encodeBase32",
    ()=>encodeBase32,
    "encodeBase64",
    ()=>encodeBase64,
    "encodeBase64Url",
    ()=>encodeBase64Url,
    "getBase32CharacterFromIndex",
    ()=>getBase32CharacterFromIndex,
    "getBase32IndexFromCharacter",
    ()=>getBase32IndexFromCharacter,
    "isBase32",
    ()=>isBase32,
    "isBase64",
    ()=>isBase64,
    "isBase64Url",
    ()=>isBase64Url,
    "toHexString",
    ()=>toHexString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
;
var crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
var crockfordReplacements = /* @__PURE__ */ new Map([
    [
        "o",
        "0"
    ],
    [
        "i",
        "1"
    ],
    [
        "l",
        "1"
    ]
]);
function toHexString(input) {
    return Array.from(input).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
function getBase32CharacterFromIndex(index) {
    if (index < 0 || index >= crockfordAlphabet.length) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Invalid base32 index: ${index}`);
    }
    return crockfordAlphabet[index];
}
function getBase32IndexFromCharacter(character) {
    if (character.length !== 1) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Invalid base32 character: ${character}`);
    }
    const index = crockfordAlphabet.indexOf(character.toUpperCase());
    if (index === -1) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Invalid base32 character: ${character}`);
    }
    return index;
}
function encodeBase32(input) {
    let bits = 0;
    let value = 0;
    let output = "";
    for(let i = 0; i < input.length; i++){
        value = value << 8 | input[i];
        bits += 8;
        while(bits >= 5){
            output += getBase32CharacterFromIndex(value >>> bits - 5 & 31);
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += getBase32CharacterFromIndex(value << 5 - bits & 31);
    }
    if (!isBase32(output)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid base32 output; this should never happen");
    }
    return output;
}
function decodeBase32(input) {
    if (!isBase32(input)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid base32 string");
    }
    const output = new Uint8Array(input.length * 5 / 8 | 0);
    let bits = 0;
    let value = 0;
    let outputIndex = 0;
    for(let i = 0; i < input.length; i++){
        let char = input[i].toLowerCase();
        if (char === " ") continue;
        if (crockfordReplacements.has(char)) {
            char = crockfordReplacements.get(char);
        }
        const index = getBase32IndexFromCharacter(char);
        value = value << 5 | index;
        bits += 5;
        if (bits >= 8) {
            output[outputIndex++] = value >>> bits - 8 & 255;
            bits -= 8;
        }
    }
    return output;
}
function encodeBase64(input) {
    return btoa([
        ...input
    ].map((b)=>String.fromCharCode(b)).join(""));
}
function decodeBase64(input) {
    return new Uint8Array(atob(input).split("").map((char)=>char.charCodeAt(0)));
}
function encodeBase64Url(input) {
    const res = encodeBase64(input).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    return res;
}
function decodeBase64Url(input) {
    if (!isBase64Url(input)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid base64url string");
    }
    if (input === "") {
        return new Uint8Array(0);
    }
    return decodeBase64(input.replace(/-/g, "+").replace(/_/g, "/") + "====".slice((input.length - 1) % 4 + 1));
}
function decodeBase64OrBase64Url(input) {
    if (isBase64Url(input)) {
        return decodeBase64Url(input);
    } else if (isBase64(input)) {
        return decodeBase64(input);
    } else {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid base64 or base64url string");
    }
}
function isBase32(input) {
    for (const char of input){
        if (char === " ") continue;
        const upperChar = char.toUpperCase();
        if (!crockfordAlphabet.includes(upperChar)) {
            return false;
        }
    }
    return true;
}
function isBase64(input) {
    const regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return regex.test(input);
}
function isBase64Url(input) {
    if (input === "") {
        return true;
    }
    const regex = /^[0-9a-zA-Z_-]+$/;
    return regex.test(input);
}
;
 //# sourceMappingURL=bytes.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/crypto.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/crypto.tsx
__turbopack_context__.s([
    "decrypt",
    ()=>decrypt,
    "encrypt",
    ()=>encrypt,
    "generateRandomValues",
    ()=>generateRandomValues,
    "generateSecureRandomString",
    ()=>generateSecureRandomString,
    "hash",
    ()=>hash,
    "iteratedHash",
    ()=>iteratedHash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
;
;
;
;
function generateRandomValues(array) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].crypto) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Crypto API is not available in this environment. Are you using an old browser?");
    }
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].crypto.getRandomValues) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("crypto.getRandomValues is not available in this environment. Are you using an old browser?");
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].crypto.getRandomValues(array);
}
function generateSecureRandomString(minBitsOfEntropy = 224) {
    const base32CharactersCount = Math.ceil(minBitsOfEntropy / 5);
    const bytesCount = Math.ceil(base32CharactersCount * 5 / 8);
    const randomBytes = generateRandomValues(new Uint8Array(bytesCount));
    const str = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase32"])(randomBytes);
    return str.slice(str.length - base32CharactersCount).toLowerCase();
}
async function getDerivedSymmetricKey(purpose, secret, salt) {
    const originalSecretKey = await crypto.subtle.importKey("raw", typeof secret === "string" ? new TextEncoder().encode(secret) : secret, "HKDF", false, [
        "deriveKey"
    ]);
    return await crypto.subtle.deriveKey({
        name: "HKDF",
        salt,
        hash: "SHA-256",
        info: new TextEncoder().encode(JSON.stringify([
            "stack-crypto-helper-derived-symmetric-key",
            purpose,
            typeof secret === "string" ? "string-key" : "binary-key",
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(salt)
        ]))
    }, originalSecretKey, {
        name: "AES-GCM",
        length: 256
    }, false, [
        "encrypt",
        "decrypt"
    ]);
}
async function encrypt({ purpose, secret, value }) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedSecretKey = await getDerivedSymmetricKey(purpose, secret, salt);
    const cipher = await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv
    }, derivedSecretKey, value);
    const version = [
        1,
        0
    ];
    return new Uint8Array([
        ...version,
        ...salt,
        ...iv,
        ...new Uint8Array(cipher)
    ]);
}
async function decrypt({ purpose, secret, cipher }) {
    const version = cipher.slice(0, 2);
    if (version[0] !== 1 || version[1] !== 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid ciphertext version in decrypt(...); expected 0x0100", {
        purpose
    });
    const salt = cipher.slice(2, 18);
    const iv = cipher.slice(18, 30);
    const cipherBytes = cipher.slice(30);
    const derivedSecretKey = await getDerivedSymmetricKey(purpose, secret, salt);
    try {
        const plaintext = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv
        }, derivedSecretKey, cipherBytes);
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(new Uint8Array(plaintext));
    } catch (e) {
        if (e instanceof DOMException && e.name === "OperationError") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new Error("Invalid ciphertext or secret when decrypting encrypted value", {
                cause: e
            }));
        }
        throw e;
    }
}
async function hash(options) {
    return await iteratedHash({
        ...options,
        iterations: 1
    });
}
async function iteratedHash(options) {
    const stringOrUint8ArrayToUint8Array = (value)=>typeof value === "string" ? new TextEncoder().encode(value) : value;
    const stringOrUint8ArrayToBase64 = (value)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(stringOrUint8ArrayToUint8Array(value));
    const input = await crypto.subtle.importKey("raw", stringOrUint8ArrayToUint8Array(options.value), "PBKDF2", false, [
        "deriveBits"
    ]);
    return new Uint8Array(await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt: new TextEncoder().encode(JSON.stringify([
            "stack-crypto-helper-iterated-hash",
            options.purpose,
            stringOrUint8ArrayToBase64(options.salt ?? ""),
            stringOrUint8ArrayToBase64(options.extra ?? "")
        ])),
        iterations: options.iterations,
        hash: "SHA-256"
    }, input, 256));
}
;
 //# sourceMappingURL=crypto.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/uuids.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/uuids.tsx
__turbopack_context__.s([
    "generateUuid",
    ()=>generateUuid,
    "isUuid",
    ()=>isUuid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/crypto.js [app-client] (ecmascript)");
;
function generateUuid() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c)=>(+c ^ (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateRandomValues"])(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
}
function isUuid(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);
}
;
 //# sourceMappingURL=uuids.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/promises.tsx
__turbopack_context__.s([
    "concatStacktracesIfRejected",
    ()=>concatStacktracesIfRejected,
    "createPromise",
    ()=>createPromise,
    "ignoreUnhandledRejection",
    ()=>ignoreUnhandledRejection,
    "neverResolve",
    ()=>neverResolve,
    "pending",
    ()=>pending,
    "rateLimited",
    ()=>rateLimited,
    "rejected",
    ()=>rejected,
    "resolved",
    ()=>resolved,
    "runAsynchronously",
    ()=>runAsynchronously,
    "runAsynchronouslyWithAlert",
    ()=>runAsynchronouslyWithAlert,
    "throttled",
    ()=>throttled,
    "timeout",
    ()=>timeout,
    "timeoutThrow",
    ()=>timeoutThrow,
    "wait",
    ()=>wait,
    "waitUntil",
    ()=>waitUntil
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/maps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/uuids.js [app-client] (ecmascript)");
;
;
;
;
;
function createPromise(callback) {
    let status = "pending";
    let valueOrReason = void 0;
    let resolve = null;
    let reject = null;
    const promise = new Promise((res, rej)=>{
        resolve = (value)=>{
            if (status !== "pending") return;
            status = "fulfilled";
            valueOrReason = value;
            res(value);
        };
        reject = (reason)=>{
            if (status !== "pending") return;
            status = "rejected";
            valueOrReason = reason;
            rej(reason);
        };
    });
    callback(resolve, reject);
    return Object.assign(promise, {
        status,
        ...status === "fulfilled" ? {
            value: valueOrReason
        } : {},
        ...status === "rejected" ? {
            reason: valueOrReason
        } : {}
    });
}
var resolvedCache = null;
function resolved(value) {
    resolvedCache ??= new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DependenciesMap"]();
    if (resolvedCache.has([
        value
    ])) {
        return resolvedCache.get([
            value
        ]);
    }
    const res = Object.assign(Promise.resolve(value), {
        status: "fulfilled",
        value
    });
    resolvedCache.set([
        value
    ], res);
    return res;
}
var rejectedCache = null;
function rejected(reason) {
    rejectedCache ??= new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DependenciesMap"]();
    if (rejectedCache.has([
        reason
    ])) {
        return rejectedCache.get([
            reason
        ]);
    }
    const promise = Promise.reject(reason);
    ignoreUnhandledRejection(promise);
    const res = Object.assign(promise, {
        status: "rejected",
        reason
    });
    rejectedCache.set([
        reason
    ], res);
    return res;
}
var neverResolvePromise = pending(new Promise(()=>{}));
function neverResolve() {
    return neverResolvePromise;
}
function pending(promise, options = {}) {
    const res = promise.then((value)=>{
        res.status = "fulfilled";
        res.value = value;
        return value;
    }, (actualReason)=>{
        res.status = "rejected";
        res.reason = actualReason;
        throw actualReason;
    });
    res.status = "pending";
    return res;
}
function ignoreUnhandledRejection(promise) {
    promise.catch(()=>{});
}
function concatStacktracesIfRejected(promise) {
    const currentError = new Error();
    promise.catch((error)=>{
        if (error instanceof Error) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["concatStacktraces"])(error, currentError);
        } else {}
    });
}
async function wait(ms) {
    if (!Number.isFinite(ms) || ms < 0) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`wait() requires a non-negative integer number of milliseconds to wait. (found: ${ms}ms)`);
    }
    if (ms >= 2 ** 31) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("The maximum timeout for wait() is 2147483647ms (2**31 - 1). (found: ${ms}ms)");
    }
    return await new Promise((resolve)=>setTimeout(resolve, ms));
}
async function waitUntil(date) {
    return await wait(date.getTime() - Date.now());
}
function runAsynchronouslyWithAlert(...args) {
    return runAsynchronously(args[0], {
        ...args[1],
        onError: (error)=>{
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownError"].isKnownError(error) && typeof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] !== "undefined" && ("TURBOPACK compile-time value", "development")?.includes("production")) {
                alert(error.message);
            } else {
                alert(`An unhandled error occurred. Please ${("TURBOPACK compile-time truthy", 1) ? `check the browser console for the full error.` : "TURBOPACK unreachable"}

${error}`);
            }
            args[1]?.onError?.(error);
        }
    }, ...args.slice(2));
}
function runAsynchronously(promiseOrFunc, options = {}) {
    if (typeof promiseOrFunc === "function") {
        promiseOrFunc = promiseOrFunc();
    }
    if (promiseOrFunc) {
        concatStacktracesIfRejected(promiseOrFunc);
        promiseOrFunc.catch((error)=>{
            options.onError?.(error);
            const newError = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Uncaught error in asynchronous function: " + (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["errorToNiceString"])(error), {
                cause: error
            });
            if (!options.noErrorLogging) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureError"])("runAsynchronously", newError);
            }
        });
    }
}
var TimeoutError = class extends Error {
    constructor(ms){
        super(`Timeout after ${ms}ms`);
        this.ms = ms;
        this.name = "TimeoutError";
    }
};
async function timeout(promiseOrFunc, ms) {
    const promise = typeof promiseOrFunc === "function" ? promiseOrFunc() : promiseOrFunc;
    return await Promise.race([
        promise.then((value)=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(value)),
        wait(ms).then(()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new TimeoutError(ms)))
    ]);
}
async function timeoutThrow(promise, ms) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].orThrow(await timeout(promise, ms));
}
function rateLimited(func, options) {
    let waitUntil2 = performance.now();
    let queue = [];
    let addedToQueueCallbacks = /* @__PURE__ */ new Map();
    const next = async ()=>{
        while(true){
            if (waitUntil2 > performance.now()) {
                await wait(Math.max(1, waitUntil2 - performance.now() + 1));
            } else if (queue.length === 0) {
                const uuid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUuid"])();
                await new Promise((resolve)=>{
                    addedToQueueCallbacks.set(uuid, resolve);
                });
                addedToQueueCallbacks.delete(uuid);
            } else {
                break;
            }
        }
        const nextFuncs = options.batchCalls ? queue.splice(0, queue.length) : [
            queue.shift()
        ];
        const start = performance.now();
        const value = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromPromise(func());
        const end = performance.now();
        waitUntil2 = Math.max(waitUntil2, start + (options.throttleMs ?? 0), end + (options.gapMs ?? 0));
        for (const nextFunc of nextFuncs){
            if (value.status === "ok") {
                nextFunc[0](value.data);
            } else {
                nextFunc[1](value.error);
            }
        }
    };
    runAsynchronously(async ()=>{
        while(true){
            await next();
        }
    });
    return ()=>{
        return new Promise((resolve, reject)=>{
            waitUntil2 = Math.max(waitUntil2, performance.now() + (options.debounceMs ?? 0));
            queue.push([
                resolve,
                reject
            ]);
            addedToQueueCallbacks.forEach((cb)=>cb());
        });
    };
}
function throttled(func, delayMs) {
    let timeout2 = null;
    let nextAvailable = null;
    return async (...args)=>{
        while(nextAvailable !== null){
            await nextAvailable;
        }
        nextAvailable = new Promise((resolve)=>{
            timeout2 = setTimeout(()=>{
                nextAvailable = null;
                resolve(func(...args));
            }, delayMs);
        });
        return await nextAvailable;
    };
}
;
 //# sourceMappingURL=promises.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/results.tsx
__turbopack_context__.s([
    "AsyncResult",
    ()=>AsyncResult,
    "Result",
    ()=>Result
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
var Result = {
    fromThrowing,
    fromThrowingAsync,
    fromPromise: promiseToResult,
    ok (data) {
        return {
            status: "ok",
            data
        };
    },
    error (error) {
        return {
            status: "error",
            error
        };
    },
    map: mapResult,
    or: (result, fallback)=>{
        return result.status === "ok" ? result.data : fallback;
    },
    orThrow: (result)=>{
        if (result.status === "error") {
            throw result.error;
        }
        return result.data;
    },
    orThrowAsync: async (result)=>{
        return Result.orThrow(await result);
    },
    retry
};
var AsyncResult = {
    fromThrowing,
    fromPromise: promiseToResult,
    ok: Result.ok,
    error: Result.error,
    pending,
    map: mapResult,
    or: (result, fallback)=>{
        if (result.status === "pending") {
            return fallback;
        }
        return Result.or(result, fallback);
    },
    orThrow: (result)=>{
        if (result.status === "pending") {
            throw new Error("Result still pending");
        }
        return Result.orThrow(result);
    },
    retry
};
function pending(progress) {
    return {
        status: "pending",
        progress
    };
}
async function promiseToResult(promise) {
    try {
        const value = await promise;
        return Result.ok(value);
    } catch (error) {
        return Result.error(error);
    }
}
function fromThrowing(fn) {
    try {
        return Result.ok(fn());
    } catch (error) {
        return Result.error(error);
    }
}
async function fromThrowingAsync(fn) {
    try {
        return Result.ok(await fn());
    } catch (error) {
        return Result.error(error);
    }
}
function mapResult(result, fn) {
    if (result.status === "error") return {
        status: "error",
        error: result.error
    };
    if (result.status === "pending") return {
        status: "pending",
        ..."progress" in result ? {
            progress: result.progress
        } : {}
    };
    return Result.ok(fn(result.data));
}
var RetryError = class extends AggregateError {
    constructor(errors){
        const strings = errors.map((e)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nicify"])(e));
        const isAllSame = strings.length > 1 && strings.every((s)=>s === strings[0]);
        super(errors, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Error after ${errors.length} attempts.
      
      ${isAllSame ? __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
        Attempts 1-${errors.length}:
          ${strings[0]}
      ` : strings.map((s, i)=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
          Attempt ${i + 1}:
            ${s}
        `).join("\n\n")}
      `, {
            cause: errors[errors.length - 1]
        });
        this.errors = errors;
        this.name = "RetryError";
    }
    get attempts() {
        return this.errors.length;
    }
};
RetryError.prototype.name = "RetryError";
async function retry(fn, totalAttempts, { exponentialDelayBase = 1e3 } = {}) {
    const errors = [];
    for(let i = 0; i < totalAttempts; i++){
        const res = await fn(i);
        if (res.status === "ok") {
            return Object.assign(Result.ok(res.data), {
                attempts: i + 1
            });
        } else {
            errors.push(res.error);
            if (i < totalAttempts - 1) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])((Math.random() + 0.5) * exponentialDelayBase * 2 ** i);
            }
        }
    }
    return Object.assign(Result.error(new RetryError(errors)), {
        attempts: totalAttempts
    });
}
;
 //# sourceMappingURL=results.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/helpers/vault/client-side.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/helpers/vault/client-side.ts
__turbopack_context__.s([
    "decryptValue",
    ()=>decryptValue,
    "encryptValue",
    ()=>encryptValue,
    "hashKey",
    ()=>hashKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/crypto.js [app-client] (ecmascript)");
;
;
var hashPurpose = "stack-data-vault-client-side-encryption-key-hash";
var encryptionSecretPurpose = "stack-data-vault-client-side-encryption-value-encryption-key-hash";
var encryptionValuePurpose = "stack-data-vault-client-side-encryption-value-encryption-value-encryption";
async function getDerivedKey(secret, key) {
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["iteratedHash"])({
        purpose: encryptionSecretPurpose,
        extra: secret,
        value: key,
        iterations: 1e5
    });
}
async function hashKey(secret, key) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hash"])({
        purpose: hashPurpose,
        extra: secret,
        value: await getDerivedKey(secret, key)
    }));
}
async function encryptValue(secret, key, value) {
    const valueEncryptionDerivedKey = await getDerivedKey(secret, key);
    const bytes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encrypt"])({
        purpose: encryptionValuePurpose,
        secret: valueEncryptionDerivedKey,
        value: new TextEncoder().encode(value)
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(bytes);
}
async function decryptValue(secret, key, encryptedValue) {
    const valueEncryptionDerivedKey = await getDerivedKey(secret, key);
    const bytesResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decrypt"])({
        purpose: encryptionValuePurpose,
        secret: valueEncryptionDerivedKey,
        cipher: (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeBase64"])(encryptedValue)
    });
    if (bytesResult.status === "error") throw new Error("Data vault client-side decryption failed. Are you sure you're using the correct secret?", {
        cause: bytesResult.error
    });
    return new TextDecoder().decode(bytesResult.data);
}
;
 //# sourceMappingURL=client-side.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/urls.tsx
__turbopack_context__.s([
    "createUrlIfValid",
    ()=>createUrlIfValid,
    "getRelativePart",
    ()=>getRelativePart,
    "isChildPath",
    ()=>isChildPath,
    "isChildUrl",
    ()=>isChildUrl,
    "isLocalhost",
    ()=>isLocalhost,
    "isRelative",
    ()=>isRelative,
    "isValidHostname",
    ()=>isValidHostname,
    "isValidHostnameWithWildcards",
    ()=>isValidHostnameWithWildcards,
    "isValidUrl",
    ()=>isValidUrl,
    "matchHostnamePattern",
    ()=>matchHostnamePattern,
    "url",
    ()=>url,
    "urlString",
    ()=>urlString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/crypto.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
function createUrlIfValid(...args) {
    try {
        return new URL(...args);
    } catch (e) {
        return null;
    }
}
function isValidUrl(url2) {
    return !!createUrlIfValid(url2);
}
function isValidHostname(hostname) {
    if (!hostname || hostname.startsWith(".") || hostname.endsWith(".") || hostname.includes("..")) {
        return false;
    }
    const url2 = createUrlIfValid(`https://${hostname}`);
    if (!url2) return false;
    return url2.hostname === hostname;
}
function isValidHostnameWithWildcards(hostname) {
    if (!hostname) return false;
    const hasWildcard = hostname.includes("*");
    if (!hasWildcard) {
        return isValidHostname(hostname);
    }
    if (hostname.startsWith(".") || hostname.endsWith(".")) {
        return false;
    }
    if (hostname.includes("..")) {
        return false;
    }
    const testHostname = hostname.replace(/\*+/g, "wildcard");
    if (!/^[a-zA-Z0-9.-]+$/.test(testHostname)) {
        return false;
    }
    const segments = hostname.split(/\*+/);
    for(let i = 0; i < segments.length; i++){
        const segment = segments[i];
        if (segment === "") continue;
        if (i === 0 && segment.startsWith(".")) {
            return false;
        }
        if (i === segments.length - 1 && segment.endsWith(".")) {
            return false;
        }
        if (segment.includes("..")) {
            return false;
        }
    }
    return true;
}
function matchHostnamePattern(pattern, hostname) {
    if (!pattern.includes("*")) {
        return pattern === hostname;
    }
    let regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const doubleWildcardPlaceholder = "\0DOUBLE_WILDCARD\0";
    regexPattern = regexPattern.replace(/\*\*/g, doubleWildcardPlaceholder);
    regexPattern = regexPattern.replace(/\*/g, "[^.]*");
    regexPattern = regexPattern.replace(new RegExp(doubleWildcardPlaceholder, "g"), ".*");
    regexPattern = "^" + regexPattern + "$";
    try {
        const regex = new RegExp(regexPattern);
        return regex.test(hostname);
    } catch  {
        return false;
    }
}
function isLocalhost(urlOrString) {
    const url2 = createUrlIfValid(urlOrString);
    if (!url2) return false;
    if (url2.hostname === "localhost" || url2.hostname.endsWith(".localhost")) return true;
    if (url2.hostname.match(/^127\.\d+\.\d+\.\d+$/)) return true;
    return false;
}
function isRelative(url2) {
    const randomDomain = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSecureRandomString"])()}.stack-auth.example.com`;
    const u = createUrlIfValid(url2, `https://${randomDomain}`);
    if (!u) return false;
    if (u.host !== randomDomain) return false;
    if (u.protocol !== "https:") return false;
    return true;
}
function getRelativePart(url2) {
    return url2.pathname + url2.search + url2.hash;
}
function url(strings, ...values) {
    return new URL(urlString(strings, ...values));
}
function urlString(strings, ...values) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["templateIdentity"])(strings, ...values.map(encodeURIComponent));
}
function isChildUrl(parentUrl, maybeChildUrl) {
    return parentUrl.origin === maybeChildUrl.origin && isChildPath(parentUrl.pathname, maybeChildUrl.pathname) && [
        ...parentUrl.searchParams
    ].every(([key, value])=>maybeChildUrl.searchParams.get(key) === value) && (!parentUrl.hash || parentUrl.hash === maybeChildUrl.hash);
}
function isChildPath(parentPath, maybeChildPath) {
    parentPath = parentPath.endsWith("/") ? parentPath : parentPath + "/";
    maybeChildPath = maybeChildPath.endsWith("/") ? maybeChildPath : maybeChildPath + "/";
    return maybeChildPath.startsWith(parentPath);
}
;
 //# sourceMappingURL=urls.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/currency-constants.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/currency-constants.tsx
__turbopack_context__.s([
    "SUPPORTED_CURRENCIES",
    ()=>SUPPORTED_CURRENCIES
]);
var SUPPORTED_CURRENCIES = [
    {
        code: "USD",
        decimals: 2,
        stripeDecimals: 2
    },
    {
        code: "EUR",
        decimals: 2,
        stripeDecimals: 2
    },
    {
        code: "GBP",
        decimals: 2,
        stripeDecimals: 2
    },
    {
        code: "JPY",
        decimals: 0,
        stripeDecimals: 0
    },
    {
        code: "INR",
        decimals: 2,
        stripeDecimals: 2
    },
    {
        code: "AUD",
        decimals: 2,
        stripeDecimals: 2
    },
    {
        code: "CAD",
        decimals: 2,
        stripeDecimals: 2
    }
];
;
 //# sourceMappingURL=currency-constants.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/http.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/http.tsx
__turbopack_context__.s([
    "HTTP_METHODS",
    ()=>HTTP_METHODS,
    "decodeBasicAuthorizationHeader",
    ()=>decodeBasicAuthorizationHeader,
    "encodeBasicAuthorizationHeader",
    ()=>encodeBasicAuthorizationHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)");
;
var HTTP_METHODS = {
    "GET": {
        safe: true,
        idempotent: true
    },
    "POST": {
        safe: false,
        idempotent: false
    },
    "PUT": {
        safe: false,
        idempotent: true
    },
    "DELETE": {
        safe: false,
        idempotent: true
    },
    "PATCH": {
        safe: false,
        idempotent: false
    },
    "OPTIONS": {
        safe: true,
        idempotent: true
    },
    "HEAD": {
        safe: true,
        idempotent: true
    },
    "TRACE": {
        safe: true,
        idempotent: true
    },
    "CONNECT": {
        safe: false,
        idempotent: false
    }
};
function decodeBasicAuthorizationHeader(value) {
    const [type, encoded, ...rest] = value.split(" ");
    if (rest.length > 0) return null;
    if (!encoded) return null;
    if (type !== "Basic") return null;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBase64"])(encoded)) return null;
    const decoded = new TextDecoder().decode((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeBase64"])(encoded));
    const split = decoded.split(":");
    return [
        split[0],
        split.slice(1).join(":")
    ];
}
function encodeBasicAuthorizationHeader(id, password) {
    if (id.includes(":")) throw new Error("Basic authorization header id cannot contain ':'");
    return `Basic ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encodeBase64"])(new TextEncoder().encode(`${id}:${password}`))}`;
}
;
 //# sourceMappingURL=http.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/oauth.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/oauth.tsx
__turbopack_context__.s([
    "allProviders",
    ()=>allProviders,
    "sharedProviders",
    ()=>sharedProviders,
    "standardProviders",
    ()=>standardProviders
]);
var standardProviders = [
    "google",
    "github",
    "microsoft",
    "spotify",
    "facebook",
    "discord",
    "gitlab",
    "bitbucket",
    "linkedin",
    "apple",
    "x",
    "twitch"
];
var sharedProviders = [
    "google",
    "github",
    "microsoft",
    "spotify"
];
var allProviders = standardProviders;
;
 //# sourceMappingURL=oauth.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/schema-fields.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/schema-fields.ts
__turbopack_context__.s([
    "ReplaceFieldWithOwnUserId",
    ()=>ReplaceFieldWithOwnUserId,
    "accessTokenPayloadSchema",
    ()=>accessTokenPayloadSchema,
    "accessTokenResponseSchema",
    ()=>accessTokenResponseSchema,
    "adaptSchema",
    ()=>adaptSchema,
    "adminAuthTypeSchema",
    ()=>adminAuthTypeSchema,
    "base64Schema",
    ()=>base64Schema,
    "basicAuthorizationHeaderSchema",
    ()=>basicAuthorizationHeaderSchema,
    "clientOrHigherAuthTypeSchema",
    ()=>clientOrHigherAuthTypeSchema,
    "contactChannelIdSchema",
    ()=>contactChannelIdSchema,
    "contactChannelIsPrimarySchema",
    ()=>contactChannelIsPrimarySchema,
    "contactChannelIsVerifiedSchema",
    ()=>contactChannelIsVerifiedSchema,
    "contactChannelTypeSchema",
    ()=>contactChannelTypeSchema,
    "contactChannelUsedForAuthSchema",
    ()=>contactChannelUsedForAuthSchema,
    "contactChannelValueSchema",
    ()=>contactChannelValueSchema,
    "containedPermissionIdsSchema",
    ()=>containedPermissionIdsSchema,
    "customPermissionDefinitionIdSchema",
    ()=>customPermissionDefinitionIdSchema,
    "customerTypeSchema",
    ()=>customerTypeSchema,
    "dayIntervalOrNeverSchema",
    ()=>dayIntervalOrNeverSchema,
    "dayIntervalSchema",
    ()=>dayIntervalSchema,
    "emailHostSchema",
    ()=>emailHostSchema,
    "emailOtpSignInCallbackUrlSchema",
    ()=>emailOtpSignInCallbackUrlSchema,
    "emailPasswordSchema",
    ()=>emailPasswordSchema,
    "emailPortSchema",
    ()=>emailPortSchema,
    "emailSchema",
    ()=>emailSchema,
    "emailSenderEmailSchema",
    ()=>emailSenderEmailSchema,
    "emailSenderNameSchema",
    ()=>emailSenderNameSchema,
    "emailTemplateListSchema",
    ()=>emailTemplateListSchema,
    "emailThemeListSchema",
    ()=>emailThemeListSchema,
    "emailThemeSchema",
    ()=>emailThemeSchema,
    "emailTypeSchema",
    ()=>emailTypeSchema,
    "emailUsernameSchema",
    ()=>emailUsernameSchema,
    "emailVerificationCallbackUrlSchema",
    ()=>emailVerificationCallbackUrlSchema,
    "ensureObjectSchema",
    ()=>ensureObjectSchema,
    "handlerPathSchema",
    ()=>handlerPathSchema,
    "inlineProductSchema",
    ()=>inlineProductSchema,
    "intervalOrNeverSchema",
    ()=>intervalOrNeverSchema,
    "intervalSchema",
    ()=>intervalSchema,
    "jsonSchema",
    ()=>jsonSchema,
    "jsonStringOrEmptySchema",
    ()=>jsonStringOrEmptySchema,
    "jsonStringSchema",
    ()=>jsonStringSchema,
    "moneyAmountSchema",
    ()=>moneyAmountSchema,
    "neonAuthorizationHeaderSchema",
    ()=>neonAuthorizationHeaderSchema,
    "oauthAccountMergeStrategySchema",
    ()=>oauthAccountMergeStrategySchema,
    "oauthClientIdSchema",
    ()=>oauthClientIdSchema,
    "oauthClientSecretSchema",
    ()=>oauthClientSecretSchema,
    "oauthEnabledSchema",
    ()=>oauthEnabledSchema,
    "oauthFacebookConfigIdSchema",
    ()=>oauthFacebookConfigIdSchema,
    "oauthIdSchema",
    ()=>oauthIdSchema,
    "oauthMicrosoftTenantIdSchema",
    ()=>oauthMicrosoftTenantIdSchema,
    "oauthProviderAccountIdSchema",
    ()=>oauthProviderAccountIdSchema,
    "oauthProviderAllowConnectedAccountsSchema",
    ()=>oauthProviderAllowConnectedAccountsSchema,
    "oauthProviderAllowSignInSchema",
    ()=>oauthProviderAllowSignInSchema,
    "oauthProviderEmailSchema",
    ()=>oauthProviderEmailSchema,
    "oauthProviderIdSchema",
    ()=>oauthProviderIdSchema,
    "oauthProviderProviderConfigIdSchema",
    ()=>oauthProviderProviderConfigIdSchema,
    "oauthProviderTypeSchema",
    ()=>oauthProviderTypeSchema,
    "oauthTypeSchema",
    ()=>oauthTypeSchema,
    "passwordSchema",
    ()=>passwordSchema,
    "permissionDefinitionIdSchema",
    ()=>permissionDefinitionIdSchema,
    "priceOrIncludeByDefaultSchema",
    ()=>priceOrIncludeByDefaultSchema,
    "primaryEmailAuthEnabledSchema",
    ()=>primaryEmailAuthEnabledSchema,
    "primaryEmailSchema",
    ()=>primaryEmailSchema,
    "primaryEmailVerifiedSchema",
    ()=>primaryEmailVerifiedSchema,
    "productPriceSchema",
    ()=>productPriceSchema,
    "productSchema",
    ()=>productSchema,
    "profileImageUrlSchema",
    ()=>profileImageUrlSchema,
    "projectAllowLocalhostSchema",
    ()=>projectAllowLocalhostSchema,
    "projectBranchIdSchema",
    ()=>projectBranchIdSchema,
    "projectClientTeamCreationEnabledSchema",
    ()=>projectClientTeamCreationEnabledSchema,
    "projectClientUserDeletionEnabledSchema",
    ()=>projectClientUserDeletionEnabledSchema,
    "projectConfigIdSchema",
    ()=>projectConfigIdSchema,
    "projectCreateTeamOnSignUpSchema",
    ()=>projectCreateTeamOnSignUpSchema,
    "projectCreatedAtMillisSchema",
    ()=>projectCreatedAtMillisSchema,
    "projectCredentialEnabledSchema",
    ()=>projectCredentialEnabledSchema,
    "projectDescriptionSchema",
    ()=>projectDescriptionSchema,
    "projectDisplayNameSchema",
    ()=>projectDisplayNameSchema,
    "projectFullLogoUrlSchema",
    ()=>projectFullLogoUrlSchema,
    "projectIdSchema",
    ()=>projectIdSchema,
    "projectIsProductionModeSchema",
    ()=>projectIsProductionModeSchema,
    "projectLogoUrlSchema",
    ()=>projectLogoUrlSchema,
    "projectMagicLinkEnabledSchema",
    ()=>projectMagicLinkEnabledSchema,
    "projectPasskeyEnabledSchema",
    ()=>projectPasskeyEnabledSchema,
    "projectSignUpEnabledSchema",
    ()=>projectSignUpEnabledSchema,
    "refreshTokenResponseSchema",
    ()=>refreshTokenResponseSchema,
    "selectedTeamIdSchema",
    ()=>selectedTeamIdSchema,
    "serverOrHigherAuthTypeSchema",
    ()=>serverOrHigherAuthTypeSchema,
    "signInEmailSchema",
    ()=>signInEmailSchema,
    "signInResponseSchema",
    ()=>signInResponseSchema,
    "signedUpAtMillisSchema",
    ()=>signedUpAtMillisSchema,
    "strictEmailSchema",
    ()=>strictEmailSchema,
    "teamClientMetadataSchema",
    ()=>teamClientMetadataSchema,
    "teamClientReadOnlyMetadataSchema",
    ()=>teamClientReadOnlyMetadataSchema,
    "teamCreatedAtMillisSchema",
    ()=>teamCreatedAtMillisSchema,
    "teamCreatorUserIdSchema",
    ()=>teamCreatorUserIdSchema,
    "teamDisplayNameSchema",
    ()=>teamDisplayNameSchema,
    "teamIdSchema",
    ()=>teamIdSchema,
    "teamInvitationCallbackUrlSchema",
    ()=>teamInvitationCallbackUrlSchema,
    "teamInvitationEmailSchema",
    ()=>teamInvitationEmailSchema,
    "teamMemberDisplayNameSchema",
    ()=>teamMemberDisplayNameSchema,
    "teamMemberProfileImageUrlSchema",
    ()=>teamMemberProfileImageUrlSchema,
    "teamPermissionDescriptionSchema",
    ()=>teamPermissionDescriptionSchema,
    "teamProfileImageUrlSchema",
    ()=>teamProfileImageUrlSchema,
    "teamServerMetadataSchema",
    ()=>teamServerMetadataSchema,
    "teamSystemPermissions",
    ()=>teamSystemPermissions,
    "templateThemeIdSchema",
    ()=>templateThemeIdSchema,
    "urlSchema",
    ()=>urlSchema,
    "userClientMetadataSchema",
    ()=>userClientMetadataSchema,
    "userClientReadOnlyMetadataSchema",
    ()=>userClientReadOnlyMetadataSchema,
    "userDisplayNameSchema",
    ()=>userDisplayNameSchema,
    "userHasPasswordSchema",
    ()=>userHasPasswordSchema,
    "userIdOrMeSchema",
    ()=>userIdOrMeSchema,
    "userIdSchema",
    ()=>userIdSchema,
    "userLastActiveAtMillisSchema",
    ()=>userLastActiveAtMillisSchema,
    "userOAuthProviderSchema",
    ()=>userOAuthProviderSchema,
    "userOtpAuthEnabledMutationSchema",
    ()=>userOtpAuthEnabledMutationSchema,
    "userOtpAuthEnabledSchema",
    ()=>userOtpAuthEnabledSchema,
    "userPasskeyAuthEnabledSchema",
    ()=>userPasskeyAuthEnabledSchema,
    "userPasswordHashMutationSchema",
    ()=>userPasswordHashMutationSchema,
    "userPasswordMutationSchema",
    ()=>userPasswordMutationSchema,
    "userServerMetadataSchema",
    ()=>userServerMetadataSchema,
    "userSpecifiedIdSchema",
    ()=>userSpecifiedIdSchema,
    "userTotpSecretMutationSchema",
    ()=>userTotpSecretMutationSchema,
    "wildcardUrlSchema",
    ()=>wildcardUrlSchema,
    "yupArray",
    ()=>yupArray,
    "yupBoolean",
    ()=>yupBoolean,
    "yupDate",
    ()=>yupDate,
    "yupDefinedAndNonEmptyWhen",
    ()=>yupDefinedAndNonEmptyWhen,
    "yupDefinedWhen",
    ()=>yupDefinedWhen,
    "yupMixed",
    ()=>yupMixed,
    "yupNever",
    ()=>yupNever,
    "yupNumber",
    ()=>yupNumber,
    "yupObject",
    ()=>yupObject,
    "yupObjectWithAutoDefault",
    ()=>yupObjectWithAutoDefault,
    "yupRecord",
    ()=>yupRecord,
    "yupString",
    ()=>yupString,
    "yupTuple",
    ()=>yupTuple,
    "yupUnion",
    ()=>yupUnion,
    "yupValidate",
    ()=>yupValidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/yup/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/bytes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$currency$2d$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/currency-constants.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$http$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/http.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/oauth.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/uuids.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
var MAX_IMAGE_SIZE_BASE64_BYTES = 1e6;
__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMethod"](__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["string"], "nonEmpty", function(message) {
    return this.test("non-empty", message ?? (({ path })=>`${path} must not be empty`), (value)=>{
        return value !== "";
    });
});
__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMethod"](__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Schema"], "hasNested", function(path) {
    if (!path.match(/^[a-zA-Z0-9_$:-]*$/)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`yupSchema.hasNested can currently only be used with alphanumeric keys, underscores, dollar signs, colons, and hyphens. Fix this in the future. Provided key: ${JSON.stringify(path)}`);
    const schemaInfo = this.meta()?.stackSchemaInfo;
    if (schemaInfo?.type === "record") {
        return schemaInfo.keySchema.isValidSync(path);
    } else if (schemaInfo?.type === "union") {
        return schemaInfo.items.some((s)=>s.hasNested(path));
    } else {
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reach"](this, path);
            return true;
        } catch (e) {
            if (e instanceof Error && e.message.includes("The schema does not contain the path")) {
                return false;
            }
            throw e;
        }
    }
});
__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMethod"](__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Schema"], "getNested", function(path) {
    if (!path.match(/^[a-zA-Z0-9_$:-]*$/)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`yupSchema.getNested can currently only be used with alphanumeric keys, underscores, dollar signs, colons, and hyphens. Fix this in the future. Provided key: ${JSON.stringify(path)}`);
    if (!this.hasNested(path)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Tried to call yupSchema.getNested, but key is not present in the schema. Provided key: ${path}`, {
        path,
        schema: this
    });
    const schemaInfo = this.meta()?.stackSchemaInfo;
    if (schemaInfo?.type === "record") {
        return schemaInfo.valueSchema;
    } else if (schemaInfo?.type === "union") {
        const schemasWithNested = schemaInfo.items.filter((s)=>s.hasNested(path));
        return yupUnion(...schemasWithNested.map((s)=>s.getNested(path)));
    } else {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reach"](this, path);
    }
});
async function yupValidate(schema, obj, options) {
    try {
        return await schema.validate(obj, {
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["omit"])(options ?? {}, [
                "currentUserId"
            ]),
            context: {
                ...options?.context,
                stackAllowUserIdMe: options?.currentUserId !== void 0
            }
        });
    } catch (error) {
        if (error instanceof ReplaceFieldWithOwnUserId) {
            const currentUserId = options?.currentUserId;
            if (!currentUserId) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CannotGetOwnUserWithoutUser();
            let pathRemaining = error.path;
            const fieldPath = [];
            while(pathRemaining.length > 0){
                if (pathRemaining.startsWith("[")) {
                    const index = pathRemaining.indexOf("]");
                    if (index < 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Invalid path");
                    fieldPath.push(JSON.parse(pathRemaining.slice(1, index)));
                    pathRemaining = pathRemaining.slice(index + 1);
                } else {
                    let dotIndex = pathRemaining.indexOf(".");
                    if (dotIndex === -1) dotIndex = pathRemaining.length;
                    fieldPath.push(pathRemaining.slice(0, dotIndex));
                    pathRemaining = pathRemaining.slice(dotIndex + 1);
                }
            }
            const newObj = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deepPlainClone"])(obj);
            let it = newObj;
            for (const field of fieldPath.slice(0, -1)){
                if (!Object.prototype.hasOwnProperty.call(it, field)) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Segment ${field} of path ${error.path} not found in object`);
                }
                it = it[field];
            }
            it[fieldPath[fieldPath.length - 1]] = currentUserId;
            return await yupValidate(schema, newObj, options);
        }
        throw error;
    }
}
var _idDescription = (identify)=>`The unique identifier of the ${identify}`;
var _displayNameDescription = (identify)=>`Human-readable ${identify} display name. This is not a unique identifier.`;
var _clientMetaDataDescription = (identify)=>`Client metadata. Used as a data store, accessible from the client side. Do not store information that should not be exposed to the client.`;
var _clientReadOnlyMetaDataDescription = (identify)=>`Client read-only, server-writable metadata. Used as a data store, accessible from the client side. Do not store information that should not be exposed to the client. The client can read this data, but cannot modify it. This is useful for things like subscription status.`;
var _profileImageUrlDescription = (identify)=>`URL of the profile image for ${identify}. Can be a Base64 encoded image. Must be smaller than 100KB. Please compress and crop to a square before passing in.`;
var _serverMetaDataDescription = (identify)=>`Server metadata. Used as a data store, only accessible from the server side. You can store secret information related to the ${identify} here.`;
var _atMillisDescription = (identify)=>`(the number of milliseconds since epoch, January 1, 1970, UTC)`;
var _createdAtMillisDescription = (identify)=>`The time the ${identify} was created ${_atMillisDescription(identify)}`;
var _signedUpAtMillisDescription = `The time the user signed up ${_atMillisDescription}`;
var _lastActiveAtMillisDescription = `The time the user was last active ${_atMillisDescription}`;
function yupString(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["string"](...args).meta({
        stackSchemaInfo: {
            type: "string"
        }
    });
}
function yupNumber(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["number"](...args).meta({
        stackSchemaInfo: {
            type: "number"
        }
    });
}
function yupBoolean(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boolean"](...args).meta({
        stackSchemaInfo: {
            type: "boolean"
        }
    });
}
function yupDate(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["date"](...args).meta({
        stackSchemaInfo: {
            type: "date"
        }
    });
}
function _yupMixedInternal(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mixed"](...args);
}
function yupMixed(...args) {
    return _yupMixedInternal(...args).meta({
        stackSchemaInfo: {
            type: "mixed"
        }
    });
}
function yupArray(...args) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["array"](...args).meta({
        stackSchemaInfo: {
            type: "array"
        }
    });
}
function yupTuple(schemas) {
    if (schemas.length === 0) throw new Error("yupTuple must have at least one schema");
    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tuple"](schemas).meta({
        stackSchemaInfo: {
            type: "tuple",
            items: schemas
        }
    });
}
function yupObjectWithAutoDefault(...args) {
    const object2 = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["object"](...args).test("no-unknown-object-properties", ({ path })=>`${path} contains unknown properties`, (value, context)=>{
        if (context.options.context?.noUnknownPathPrefixes?.some((prefix)=>context.path.startsWith(prefix))) {
            if (context.schema.spec.noUnknown !== false) {
                const availableKeys = new Set(Object.keys(context.schema.fields));
                const unknownKeys = Object.keys(value ?? {}).filter((key)=>!availableKeys.has(key));
                if (unknownKeys.length > 0) {
                    return context.createError({
                        message: `${context.path || "Object"} contains unknown properties: ${unknownKeys.join(", ")}`,
                        path: context.path,
                        params: {
                            unknownKeys,
                            availableKeys
                        }
                    });
                }
            }
        }
        return true;
    }).meta({
        stackSchemaInfo: {
            type: "object"
        }
    });
    return object2;
}
function yupObject(...args) {
    const object2 = yupObjectWithAutoDefault(...args);
    return object2.default(void 0);
}
function yupNever() {
    return _yupMixedInternal().meta({
        stackSchemaInfo: {
            type: "never"
        }
    }).test("never", "This value should never be reached", ()=>false);
}
function yupUnion(...args) {
    if (args.length === 0) throw new Error("yupUnion must have at least one schema");
    return _yupMixedInternal().meta({
        stackSchemaInfo: {
            type: "union",
            items: args
        }
    }).test("is-one-of", "Invalid value", async (value, context)=>{
        if (value == null) return true;
        const errors = [];
        for (const schema of args){
            try {
                await yupValidate(schema, value, context.options);
                return true;
            } catch (e) {
                errors.push(e);
            }
        }
        return context.createError({
            message: __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
        ${context.path} is not matched by any of the provided schemas:
          ${errors.map((e, i)=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
            Schema ${i}:
              ${e.errors.join("\n")}
          `).join("\n")}`,
            path: context.path
        });
    });
}
function yupRecord(keySchema, valueSchema) {
    return yupObject().meta({
        stackSchemaInfo: {
            type: "record",
            keySchema,
            valueSchema
        }
    }).unknown(true).test("record", "${path} must be a record of valid values", async function(value, context) {
        if (value == null) return true;
        const { path, createError } = this;
        if (typeof value !== "object") {
            return createError({
                message: `${path} must be an object`
            });
        }
        for (const key of Object.keys(value)){
            await yupValidate(keySchema, key, context.options);
            try {
                await yupValidate(valueSchema, value[key], {
                    ...context.options,
                    context: {
                        ...context.options.context,
                        path: path ? `${path}.${key}` : key
                    }
                });
            } catch (e) {
                return createError({
                    path: path ? `${path}.${key}` : key,
                    message: e.message
                });
            }
        }
        return true;
    });
}
function ensureObjectSchema(schema) {
    if (!(schema instanceof __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$yup$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObjectSchema"])) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`assertObjectSchema: schema is not an ObjectSchema: ${schema.describe().type}`);
    return schema;
}
var adaptSchema = yupMixed();
var urlSchema = yupString().test({
    name: "no-spaces",
    message: (params)=>`${params.path} contains spaces`,
    test: (value)=>value == null || !value.includes(" ")
}).test({
    name: "url",
    message: (params)=>`${params.path} is not a valid URL`,
    test: (value)=>value == null || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUrl"])(value)
});
var wildcardUrlSchema = yupString().test({
    name: "no-spaces",
    message: (params)=>`${params.path} contains spaces`,
    test: (value)=>value == null || !value.includes(" ")
}).test({
    name: "wildcard-url",
    message: (params)=>`${params.path} is not a valid URL or wildcard URL pattern`,
    test: (value)=>{
        if (value == null) return true;
        if (!value.includes("*")) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUrl"])(value);
        }
        try {
            const PLACEHOLDER = "wildcard-placeholder";
            const normalizedUrl = value.replace(/\*/g, PLACEHOLDER);
            const url = new URL(normalizedUrl);
            if (url.username.includes(PLACEHOLDER) || url.password.includes(PLACEHOLDER) || url.pathname.includes(PLACEHOLDER) || url.search.includes(PLACEHOLDER) || url.hash.includes(PLACEHOLDER)) {
                return false;
            }
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return false;
            }
            const hostPattern = url.hostname.split(PLACEHOLDER).join("*");
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidHostnameWithWildcards"])(hostPattern);
        } catch (e) {
            return false;
        }
    }
});
var jsonSchema = yupMixed().nullable().defined().transform((value)=>JSON.parse(JSON.stringify(value)));
var jsonStringSchema = yupString().test("json", (params)=>`${params.path} is not valid JSON`, (value)=>{
    if (value == null) return true;
    try {
        JSON.parse(value);
        return true;
    } catch (error) {
        return false;
    }
});
var jsonStringOrEmptySchema = yupString().test("json", (params)=>`${params.path} is not valid JSON`, (value)=>{
    if (!value) return true;
    try {
        JSON.parse(value);
        return true;
    } catch (error) {
        return false;
    }
});
var base64Schema = yupString().test("is-base64", (params)=>`${params.path} is not valid base64`, (value)=>{
    if (value == null) return true;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$bytes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBase64"])(value);
});
var passwordSchema = yupString().max(70);
var intervalSchema = yupTuple([
    yupNumber().min(0).integer().defined(),
    yupString().oneOf([
        "millisecond",
        "second",
        "minute",
        "hour",
        "day",
        "week",
        "month",
        "year"
    ]).defined()
]);
var dayIntervalSchema = yupTuple([
    yupNumber().min(0).integer().defined(),
    yupString().oneOf([
        "day",
        "week",
        "month",
        "year"
    ]).defined()
]);
var intervalOrNeverSchema = yupUnion(intervalSchema.defined(), yupString().oneOf([
    "never"
]).defined());
var dayIntervalOrNeverSchema = yupUnion(dayIntervalSchema.defined(), yupString().oneOf([
    "never"
]).defined());
var userSpecifiedIdSchema = (idName)=>yupString().max(63).matches(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/, `${idName} must contain only letters, numbers, underscores, and hyphens, and not start with a hyphen`);
var moneyAmountSchema = (currency)=>yupString().test("money-amount", "Invalid money amount", (value, context)=>{
        if (value == null) return true;
        const regex = /^([0-9]+)(\.([0-9]+))?$/;
        const match = value.match(regex);
        if (!match) return context.createError({
            message: "Money amount must be in the format of <number> or <number>.<number>"
        });
        const whole = match[1];
        const decimals = match[3];
        if (decimals && decimals.length > currency.decimals) return context.createError({
            message: `Too many decimals; ${currency.code} only has ${currency.decimals} decimals`
        });
        if (whole !== "0" && whole.startsWith("0")) return context.createError({
            message: "Money amount must not have leading zeros"
        });
        return true;
    });
var strictEmailSchema = (message)=>yupString().email(message).max(256).matches(/^[^.]+(\.[^.]+)*@.*\.[^.][^.]+$/, message);
var emailSchema = yupString().email();
var clientOrHigherAuthTypeSchema = yupString().oneOf([
    "client",
    "server",
    "admin"
]).defined();
var serverOrHigherAuthTypeSchema = yupString().oneOf([
    "server",
    "admin"
]).defined();
var adminAuthTypeSchema = yupString().oneOf([
    "admin"
]).defined();
var projectIdSchema = yupString().test((v)=>v === void 0 || v === "internal" || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isUuid"])(v)).meta({
    openapiField: {
        description: _idDescription("project"),
        exampleValue: "e0b52f4d-dece-408c-af49-d23061bb0f8d"
    }
});
var projectBranchIdSchema = yupString().nonEmpty().max(255).meta({
    openapiField: {
        description: _idDescription("project branch"),
        exampleValue: "main"
    }
});
var projectDisplayNameSchema = yupString().meta({
    openapiField: {
        description: _displayNameDescription("project"),
        exampleValue: "MyMusic"
    }
});
var projectLogoUrlSchema = urlSchema.max(MAX_IMAGE_SIZE_BASE64_BYTES).meta({
    openapiField: {
        description: "URL of the logo for the project. This is usually a close to 1:1 image of the company logo.",
        exampleValue: "https://example.com/logo.png"
    }
});
var projectFullLogoUrlSchema = urlSchema.max(MAX_IMAGE_SIZE_BASE64_BYTES).meta({
    openapiField: {
        description: "URL of the full logo for the project. This is usually a vertical image with the logo and the company name.",
        exampleValue: "https://example.com/full-logo.png"
    }
});
var projectDescriptionSchema = yupString().nullable().meta({
    openapiField: {
        description: "A human readable description of the project",
        exampleValue: "A music streaming service"
    }
});
var projectCreatedAtMillisSchema = yupNumber().meta({
    openapiField: {
        description: _createdAtMillisDescription("project"),
        exampleValue: 163e10
    }
});
var projectIsProductionModeSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the project is in production mode",
        exampleValue: true
    }
});
var projectConfigIdSchema = yupString().meta({
    openapiField: {
        description: _idDescription("project config"),
        exampleValue: "d09201f0-54f5-40bd-89ff-6d1815ddad24"
    }
});
var projectAllowLocalhostSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether localhost is allowed as a domain for this project. Should only be allowed in development mode",
        exampleValue: true
    }
});
var projectCreateTeamOnSignUpSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether a team should be created for each user that signs up",
        exampleValue: true
    }
});
var projectMagicLinkEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether magic link authentication is enabled for this project",
        exampleValue: true
    }
});
var projectPasskeyEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether passkey authentication is enabled for this project",
        exampleValue: true
    }
});
var projectClientTeamCreationEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether client users can create teams",
        exampleValue: true
    }
});
var projectClientUserDeletionEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether client users can delete their own account from the client",
        exampleValue: true
    }
});
var projectSignUpEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether users can sign up new accounts, or whether they are only allowed to sign in to existing accounts. Regardless of this option, the server API can always create new users with the `POST /users` endpoint.",
        exampleValue: true
    }
});
var projectCredentialEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether email password authentication is enabled for this project",
        exampleValue: true
    }
});
var oauthIdSchema = yupString().oneOf(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allProviders"]).meta({
    openapiField: {
        description: `OAuth provider ID, one of ${__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allProviders"].map((x)=>`\`${x}\``).join(", ")}`,
        exampleValue: "google"
    }
});
var oauthEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the OAuth provider is enabled. If an provider is first enabled, then disabled, it will be shown in the list but with enabled=false",
        exampleValue: true
    }
});
var oauthTypeSchema = yupString().oneOf([
    "shared",
    "standard"
]).meta({
    openapiField: {
        description: 'OAuth provider type, one of shared, standard. "shared" uses Stack shared OAuth keys and it is only meant for development. "standard" uses your own OAuth keys and will show your logo and company name when signing in with the provider.',
        exampleValue: "standard"
    }
});
var oauthClientIdSchema = yupString().meta({
    openapiField: {
        description: 'OAuth client ID. Needs to be specified when using type="standard"',
        exampleValue: "google-oauth-client-id"
    }
});
var oauthClientSecretSchema = yupString().meta({
    openapiField: {
        description: 'OAuth client secret. Needs to be specified when using type="standard"',
        exampleValue: "google-oauth-client-secret"
    }
});
var oauthFacebookConfigIdSchema = yupString().meta({
    openapiField: {
        description: "The configuration id for Facebook business login (for things like ads and marketing). This is only required if you are using the standard OAuth with Facebook and you are using Facebook business login."
    }
});
var oauthMicrosoftTenantIdSchema = yupString().meta({
    openapiField: {
        description: "The Microsoft tenant id for Microsoft directory. This is only required if you are using the standard OAuth with Microsoft and you have an Azure AD tenant."
    }
});
var oauthAccountMergeStrategySchema = yupString().oneOf([
    "link_method",
    "raise_error",
    "allow_duplicates"
]).meta({
    openapiField: {
        description: "Determines how to handle OAuth logins that match an existing user by email. `link_method` adds the OAuth method to the existing user. `raise_error` rejects the login with an error. `allow_duplicates` creates a new user.",
        exampleValue: "link_method"
    }
});
var emailTypeSchema = yupString().oneOf([
    "shared",
    "standard"
]).meta({
    openapiField: {
        description: 'Email provider type, one of shared, standard. "shared" uses Stack shared email provider and it is only meant for development. "standard" uses your own email server and will have your email address as the sender.',
        exampleValue: "standard"
    }
});
var emailSenderNameSchema = yupString().meta({
    openapiField: {
        description: 'Email sender name. Needs to be specified when using type="standard"',
        exampleValue: "Stack"
    }
});
var emailHostSchema = yupString().meta({
    openapiField: {
        description: 'Email host. Needs to be specified when using type="standard"',
        exampleValue: "smtp.your-domain.com"
    }
});
var emailPortSchema = yupNumber().min(0).max(65535).meta({
    openapiField: {
        description: 'Email port. Needs to be specified when using type="standard"',
        exampleValue: 587
    }
});
var emailUsernameSchema = yupString().meta({
    openapiField: {
        description: 'Email username. Needs to be specified when using type="standard"',
        exampleValue: "smtp-email"
    }
});
var emailSenderEmailSchema = emailSchema.meta({
    openapiField: {
        description: 'Email sender email. Needs to be specified when using type="standard"',
        exampleValue: "example@your-domain.com"
    }
});
var emailPasswordSchema = passwordSchema.meta({
    openapiField: {
        description: 'Email password. Needs to be specified when using type="standard"',
        exampleValue: "your-email-password"
    }
});
var handlerPathSchema = yupString().test("is-handler-path", "Handler path must start with /", (value)=>value?.startsWith("/")).meta({
    openapiField: {
        description: 'Handler path. If you did not setup a custom handler path, it should be "/handler" by default. It needs to start with /',
        exampleValue: "/handler"
    }
});
var emailThemeSchema = yupString().meta({
    openapiField: {
        description: "Email theme id for the project. Determines the visual style of emails sent by the project."
    }
});
var emailThemeListSchema = yupRecord(yupString().uuid(), yupObject({
    displayName: yupString().meta({
        openapiField: {
            description: "Email theme name",
            exampleValue: "Default Light"
        }
    }).defined(),
    tsxSource: yupString().meta({
        openapiField: {
            description: "Email theme source code tsx component"
        }
    }).defined()
})).meta({
    openapiField: {
        description: "Record of email theme IDs to their display name and source code"
    }
});
var templateThemeIdSchema = yupMixed().test((v)=>v === void 0 || v === false || v === null || typeof v === "string" && (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isUuid"])(v)).meta({
    openapiField: {
        description: "Email theme id for the template"
    }
}).optional();
var emailTemplateListSchema = yupRecord(yupString().uuid(), yupObject({
    displayName: yupString().meta({
        openapiField: {
            description: "Email template name",
            exampleValue: "Email Verification"
        }
    }).defined(),
    tsxSource: yupString().meta({
        openapiField: {
            description: "Email template source code tsx component"
        }
    }).defined(),
    // themeId can be one of three values:
    // 1. A valid theme id
    // 2. false, which means the template uses no theme
    // 3. undefined/not given, which means the template uses the project's active theme
    themeId: templateThemeIdSchema
})).meta({
    openapiField: {
        description: "Record of email template IDs to their display name and source code"
    }
});
var customerTypeSchema = yupString().oneOf([
    "user",
    "team",
    "custom"
]);
var validateHasAtLeastOneSupportedCurrency = (value, context)=>{
    if (!value) return true;
    const currencies = Object.keys(value).filter((key)=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$currency$2d$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPPORTED_CURRENCIES"].some((c)=>c.code === key));
    if (currencies.length === 0) {
        return context.createError({
            message: "At least one currency is required"
        });
    }
    return true;
};
var productPriceSchema = yupObject({
    ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typedFromEntries"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$currency$2d$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPPORTED_CURRENCIES"].map((currency)=>[
            currency.code,
            moneyAmountSchema(currency).optional()
        ])),
    interval: dayIntervalSchema.optional(),
    serverOnly: yupBoolean(),
    freeTrial: dayIntervalSchema.optional()
}).test("at-least-one-currency", (value, context)=>validateHasAtLeastOneSupportedCurrency(value, context));
var priceOrIncludeByDefaultSchema = yupUnion(yupString().oneOf([
    "include-by-default"
]).meta({
    openapiField: {
        description: "Makes this item free and includes it by default for all customers.",
        exampleValue: "include-by-default"
    }
}), yupRecord(userSpecifiedIdSchema("priceId"), productPriceSchema));
var productSchema = yupObject({
    displayName: yupString(),
    catalogId: userSpecifiedIdSchema("catalogId").optional().meta({
        openapiField: {
            description: "The ID of the catalog this product belongs to. Within a catalog, all products are mutually exclusive unless they are an add-on to another product in the catalog.",
            exampleValue: "catalog-id"
        }
    }),
    isAddOnTo: yupUnion(yupBoolean().isFalse(), yupRecord(userSpecifiedIdSchema("productId"), yupBoolean().isTrue().defined())).optional().meta({
        openapiField: {
            description: "The products that this product is an add-on to. If this is set, the customer must already have one of the products in the record to be able to purchase this product.",
            exampleValue: {
                "product-id": true
            }
        }
    }),
    customerType: customerTypeSchema.defined(),
    freeTrial: dayIntervalSchema.optional(),
    serverOnly: yupBoolean(),
    stackable: yupBoolean(),
    prices: priceOrIncludeByDefaultSchema.defined(),
    includedItems: yupRecord(userSpecifiedIdSchema("itemId"), yupObject({
        quantity: yupNumber().defined(),
        repeat: dayIntervalOrNeverSchema.optional(),
        expires: yupString().oneOf([
            "never",
            "when-purchase-expires",
            "when-repeated"
        ]).optional()
    }))
});
var inlineProductSchema = yupObject({
    display_name: yupString().defined(),
    customer_type: customerTypeSchema.defined(),
    free_trial: dayIntervalSchema.optional(),
    server_only: yupBoolean().default(true),
    stackable: yupBoolean().default(false),
    prices: yupRecord(userSpecifiedIdSchema("priceId"), yupObject({
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["typedFromEntries"])(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$currency$2d$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SUPPORTED_CURRENCIES"].map((currency)=>[
                currency.code,
                moneyAmountSchema(currency).optional()
            ])),
        interval: dayIntervalSchema.optional(),
        free_trial: dayIntervalSchema.optional()
    }).test("at-least-one-currency", (value, context)=>validateHasAtLeastOneSupportedCurrency(value, context))),
    included_items: yupRecord(userSpecifiedIdSchema("itemId"), yupObject({
        quantity: yupNumber(),
        repeat: dayIntervalOrNeverSchema.optional(),
        expires: yupString().oneOf([
            "never",
            "when-purchase-expires",
            "when-repeated"
        ]).optional()
    }))
});
var ReplaceFieldWithOwnUserId = class extends Error {
    constructor(path){
        super(`This error should be caught by whoever validated the schema, and the field in the path '${path}' should be replaced with the current user's id. This is a workaround to yup not providing access to the context inside the transform function.`);
        this.path = path;
    }
};
var userIdMeSentinelUuid = "cad564fd-f81b-43f4-b390-98abf3fcc17e";
var userIdOrMeSchema = yupString().uuid().transform((v)=>{
    if (v === "me") return userIdMeSentinelUuid;
    else return v;
}).test((v, context)=>{
    if (!("stackAllowUserIdMe" in (context.options.context ?? {}))) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("userIdOrMeSchema is not allowed in this context. Make sure you're using yupValidate from schema-fields.ts to validate, instead of schema.validate(...).");
    if (!context.options.context?.stackAllowUserIdMe) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("userIdOrMeSchema is not allowed in this context. Make sure you're passing in the currentUserId option in yupValidate.");
    if (v === userIdMeSentinelUuid) throw new ReplaceFieldWithOwnUserId(context.path);
    return true;
}).meta({
    openapiField: {
        description: "The ID of the user, or the special value `me` for the currently authenticated user",
        exampleValue: "3241a285-8329-4d69-8f3d-316e08cf140c"
    }
});
var userIdSchema = yupString().uuid().meta({
    openapiField: {
        description: _idDescription("user"),
        exampleValue: "3241a285-8329-4d69-8f3d-316e08cf140c"
    }
});
var primaryEmailSchema = emailSchema.meta({
    openapiField: {
        description: "Primary email",
        exampleValue: "johndoe@example.com"
    }
});
var primaryEmailAuthEnabledSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the primary email is used for authentication. If this is set to `false`, the user will not be able to sign in with the primary email with password or OTP",
        exampleValue: true
    }
});
var primaryEmailVerifiedSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the primary email has been verified to belong to this user",
        exampleValue: true
    }
});
var userDisplayNameSchema = yupString().nullable().max(256).meta({
    openapiField: {
        description: _displayNameDescription("user"),
        exampleValue: "John Doe"
    }
});
var selectedTeamIdSchema = yupString().uuid().meta({
    openapiField: {
        description: "ID of the team currently selected by the user",
        exampleValue: "team-id"
    }
});
var profileImageUrlSchema = urlSchema.max(MAX_IMAGE_SIZE_BASE64_BYTES).meta({
    openapiField: {
        description: _profileImageUrlDescription("user"),
        exampleValue: "https://example.com/image.jpg"
    }
});
var signedUpAtMillisSchema = yupNumber().meta({
    openapiField: {
        description: _signedUpAtMillisDescription,
        exampleValue: 163e10
    }
});
var userClientMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _clientMetaDataDescription("user"),
        exampleValue: {
            key: "value"
        }
    }
});
var userClientReadOnlyMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _clientReadOnlyMetaDataDescription("user"),
        exampleValue: {
            key: "value"
        }
    }
});
var userServerMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _serverMetaDataDescription("user"),
        exampleValue: {
            key: "value"
        }
    }
});
var userOAuthProviderSchema = yupObject({
    id: yupString().defined(),
    type: yupString().oneOf(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allProviders"]).defined(),
    provider_user_id: yupString().defined()
});
var userLastActiveAtMillisSchema = yupNumber().nullable().meta({
    openapiField: {
        description: _lastActiveAtMillisDescription,
        exampleValue: 163e10
    }
});
var userPasskeyAuthEnabledSchema = yupBoolean().meta({
    openapiField: {
        hidden: true,
        description: "Whether the user has passkeys enabled",
        exampleValue: false
    }
});
var userOtpAuthEnabledSchema = yupBoolean().meta({
    openapiField: {
        hidden: true,
        description: "Whether the user has OTP/magic link enabled. ",
        exampleValue: true
    }
});
var userOtpAuthEnabledMutationSchema = yupBoolean().meta({
    openapiField: {
        hidden: true,
        description: "Whether the user has OTP/magic link enabled. Note that only accounts with verified emails can sign-in with OTP.",
        exampleValue: true
    }
});
var userHasPasswordSchema = yupBoolean().meta({
    openapiField: {
        hidden: true,
        description: "Whether the user has a password set. If the user does not have a password set, they will not be able to sign in with email/password.",
        exampleValue: true
    }
});
var userPasswordMutationSchema = passwordSchema.nullable().meta({
    openapiField: {
        description: "Sets the user's password. Doing so revokes all current sessions.",
        exampleValue: "my-new-password"
    }
}).max(70);
var userPasswordHashMutationSchema = yupString().nonEmpty().meta({
    openapiField: {
        description: "If `password` is not given, sets the user's password hash to the given string in Modular Crypt Format (ex.: `$2a$10$VIhIOofSMqGdGlL4wzE//e.77dAQGqNtF/1dT7bqCrVtQuInWy2qi`). Doing so revokes all current sessions."
    }
});
var userTotpSecretMutationSchema = base64Schema.nullable().meta({
    openapiField: {
        description: "Enables 2FA and sets a TOTP secret for the user. Set to null to disable 2FA.",
        exampleValue: "dG90cC1zZWNyZXQ="
    }
});
var accessTokenPayloadSchema = yupObject({
    sub: yupString().defined(),
    exp: yupNumber().optional(),
    iss: yupString().defined(),
    aud: yupString().defined(),
    project_id: yupString().defined(),
    branch_id: yupString().defined(),
    refresh_token_id: yupString().defined(),
    role: yupString().oneOf([
        "authenticated"
    ]).defined(),
    name: yupString().defined().nullable(),
    email: yupString().defined().nullable(),
    email_verified: yupBoolean().defined(),
    selected_team_id: yupString().defined().nullable(),
    is_anonymous: yupBoolean().defined()
});
var signInEmailSchema = strictEmailSchema(void 0).meta({
    openapiField: {
        description: "The email to sign in with.",
        exampleValue: "johndoe@example.com"
    }
});
var emailOtpSignInCallbackUrlSchema = urlSchema.meta({
    openapiField: {
        description: "The base callback URL to construct the magic link from. A query parameter `code` with the verification code will be appended to it. The page should then make a request to the `/auth/otp/sign-in` endpoint.",
        exampleValue: "https://example.com/handler/magic-link-callback"
    }
});
var emailVerificationCallbackUrlSchema = urlSchema.meta({
    openapiField: {
        description: "The base callback URL to construct a verification link for the verification e-mail. A query parameter `code` with the verification code will be appended to it. The page should then make a request to the `/contact-channels/verify` endpoint.",
        exampleValue: "https://example.com/handler/email-verification"
    }
});
var accessTokenResponseSchema = yupString().meta({
    openapiField: {
        description: "Short-lived access token that can be used to authenticate the user",
        exampleValue: "eyJhmMiJB2TO...diI4QT"
    }
});
var refreshTokenResponseSchema = yupString().meta({
    openapiField: {
        description: "Long-lived refresh token that can be used to obtain a new access token",
        exampleValue: "i8ns3aq2...14y"
    }
});
var signInResponseSchema = yupObject({
    refresh_token: refreshTokenResponseSchema.defined(),
    access_token: accessTokenResponseSchema.defined(),
    is_new_user: yupBoolean().meta({
        openapiField: {
            description: "Whether the user is a new user",
            exampleValue: true
        }
    }).defined(),
    user_id: userIdSchema.defined()
});
var teamSystemPermissions = [
    "$update_team",
    "$delete_team",
    "$read_members",
    "$remove_members",
    "$invite_members",
    "$manage_api_keys"
];
var permissionDefinitionIdSchema = yupString().matches(/^\$?[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":", "_" and optional "$" at the beginning are allowed').test("is-system-permission", "System permissions must start with a dollar sign", (value, ctx)=>{
    if (!value) return true;
    if (value.startsWith("$") && !teamSystemPermissions.includes(value)) {
        return ctx.createError({
            message: "Invalid system permission"
        });
    }
    return true;
}).meta({
    openapiField: {
        description: `The permission ID used to uniquely identify a permission. Can either be a custom permission with lowercase letters, numbers, \`:\`, and \`_\` characters, or one of the system permissions: ${teamSystemPermissions.map((x)=>`\`${x}\``).join(", ")}`,
        exampleValue: "read_secret_info"
    }
});
var customPermissionDefinitionIdSchema = yupString().matches(/^[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":", "_" are allowed').meta({
    openapiField: {
        description: 'The permission ID used to uniquely identify a permission. Can only contain lowercase letters, numbers, ":", and "_" characters',
        exampleValue: "read_secret_info"
    }
});
var teamPermissionDescriptionSchema = yupString().meta({
    openapiField: {
        description: "A human-readable description of the permission",
        exampleValue: "Read secret information"
    }
});
var containedPermissionIdsSchema = yupArray(permissionDefinitionIdSchema.defined()).meta({
    openapiField: {
        description: "The IDs of the permissions that are contained in this permission",
        exampleValue: [
            "read_public_info"
        ]
    }
});
var teamIdSchema = yupString().uuid().meta({
    openapiField: {
        description: _idDescription("team"),
        exampleValue: "ad962777-8244-496a-b6a2-e0c6a449c79e"
    }
});
var teamDisplayNameSchema = yupString().meta({
    openapiField: {
        description: _displayNameDescription("team"),
        exampleValue: "My Team"
    }
});
var teamProfileImageUrlSchema = urlSchema.max(1e6).meta({
    openapiField: {
        description: _profileImageUrlDescription("team"),
        exampleValue: "https://example.com/image.jpg"
    }
});
var teamClientMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _clientMetaDataDescription("team"),
        exampleValue: {
            key: "value"
        }
    }
});
var teamClientReadOnlyMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _clientReadOnlyMetaDataDescription("team"),
        exampleValue: {
            key: "value"
        }
    }
});
var teamServerMetadataSchema = jsonSchema.meta({
    openapiField: {
        description: _serverMetaDataDescription("team"),
        exampleValue: {
            key: "value"
        }
    }
});
var teamCreatedAtMillisSchema = yupNumber().meta({
    openapiField: {
        description: _createdAtMillisDescription("team"),
        exampleValue: 163e10
    }
});
var teamInvitationEmailSchema = emailSchema.meta({
    openapiField: {
        description: "The email of the user to invite.",
        exampleValue: "johndoe@example.com"
    }
});
var teamInvitationCallbackUrlSchema = urlSchema.meta({
    openapiField: {
        description: "The base callback URL to construct an invite link with. A query parameter `code` with the verification code will be appended to it. The page should then make a request to the `/team-invitations/accept` endpoint.",
        exampleValue: "https://example.com/handler/team-invitation"
    }
});
var teamCreatorUserIdSchema = userIdOrMeSchema.meta({
    openapiField: {
        description: 'The ID of the creator of the team. If not specified, the user will not be added to the team. Can be either "me" or the ID of the user. Only used on the client side.',
        exampleValue: "me"
    }
});
var teamMemberDisplayNameSchema = yupString().meta({
    openapiField: {
        description: _displayNameDescription("team member") + " Note that this is separate from the display_name of the user.",
        exampleValue: "John Doe"
    }
});
var teamMemberProfileImageUrlSchema = urlSchema.max(1e6).meta({
    openapiField: {
        description: _profileImageUrlDescription("team member"),
        exampleValue: "https://example.com/image.jpg"
    }
});
var contactChannelIdSchema = yupString().uuid().meta({
    openapiField: {
        description: _idDescription("contact channel"),
        exampleValue: "b3d396b8-c574-4c80-97b3-50031675ceb2"
    }
});
var contactChannelTypeSchema = yupString().oneOf([
    "email"
]).meta({
    openapiField: {
        description: `The type of the contact channel. Currently only "email" is supported.`,
        exampleValue: "email"
    }
});
var contactChannelValueSchema = yupString().when("type", {
    is: "email",
    then: (schema)=>schema.email()
}).meta({
    openapiField: {
        description: "The value of the contact channel. For email, this should be a valid email address.",
        exampleValue: "johndoe@example.com"
    }
});
var contactChannelUsedForAuthSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the contact channel is used for authentication. If this is set to `true`, the user will be able to sign in with the contact channel with password or OTP.",
        exampleValue: true
    }
});
var contactChannelIsVerifiedSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the contact channel has been verified. If this is set to `true`, the contact channel has been verified to belong to the user.",
        exampleValue: true
    }
});
var contactChannelIsPrimarySchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the contact channel is the primary contact channel. If this is set to `true`, it will be used for authentication and notifications by default.",
        exampleValue: true
    }
});
var oauthProviderIdSchema = yupString().uuid().meta({
    openapiField: {
        description: _idDescription("OAuth provider"),
        exampleValue: "b3d396b8-c574-4c80-97b3-50031675ceb2"
    }
});
var oauthProviderEmailSchema = emailSchema.meta({
    openapiField: {
        description: "Email of the OAuth provider. This is used to display and identify the OAuth provider in the UI.",
        exampleValue: "test@gmail.com"
    }
});
var oauthProviderTypeSchema = yupString().oneOf(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allProviders"]).meta({
    openapiField: {
        description: `OAuth provider type, one of ${__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$oauth$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allProviders"].map((x)=>`\`${x}\``).join(", ")}`,
        exampleValue: "google"
    }
});
var oauthProviderAllowSignInSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the user can use this OAuth provider to sign in. Only one OAuth provider per type can have this set to `true`.",
        exampleValue: true
    }
});
var oauthProviderAllowConnectedAccountsSchema = yupBoolean().meta({
    openapiField: {
        description: "Whether the user can use this OAuth provider as connected account. Multiple OAuth providers per type can have this set to `true`.",
        exampleValue: true
    }
});
var oauthProviderAccountIdSchema = yupString().meta({
    openapiField: {
        description: "Account ID of the OAuth provider. This uniquely identifies the account on the provider side.",
        exampleValue: "google-account-id-12345"
    }
});
var oauthProviderProviderConfigIdSchema = yupString().meta({
    openapiField: {
        description: "Provider config ID of the OAuth provider. This uniquely identifies the provider config on config.json file",
        exampleValue: "google"
    }
});
var basicAuthorizationHeaderSchema = yupString().test("is-basic-authorization-header", 'Authorization header must be in the format "Basic <base64>"', (value)=>{
    if (!value) return true;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$http$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeBasicAuthorizationHeader"])(value) !== null;
});
var neonAuthorizationHeaderSchema = basicAuthorizationHeaderSchema.test("is-authorization-header", "Invalid client_id:client_secret values; did you use the correct values for the integration?", (value)=>{
    if (!value) return true;
    const [clientId, clientSecret] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$http$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeBasicAuthorizationHeader"])(value) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(`Authz header invalid? This should've been validated by basicAuthorizationHeaderSchema: ${value}`);
    for (const neonClientConfig of JSON.parse(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STACK_INTEGRATION_CLIENTS_CONFIG || "[]")){
        if (clientId === neonClientConfig.client_id && clientSecret === neonClientConfig.client_secret) return true;
    }
    return false;
});
function yupDefinedWhen(schema, triggers) {
    const entries = Object.entries(triggers);
    return schema.when(entries.map(([key])=>key), {
        is: (...values)=>entries.every(([key, value], index)=>value === values[index]),
        then: (schema2)=>schema2.defined(),
        otherwise: (schema2)=>schema2.optional()
    });
}
function yupDefinedAndNonEmptyWhen(schema, triggers) {
    const entries = Object.entries(triggers);
    return schema.when(entries.map(([key])=>key), {
        is: (...values)=>entries.every(([key, value], index)=>value === values[index]),
        then: (schema2)=>schema2.defined().nonEmpty(),
        otherwise: (schema2)=>schema2.optional()
    });
}
;
 //# sourceMappingURL=schema-fields.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/locks.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/locks.tsx
__turbopack_context__.s([
    "ReadWriteLock",
    ()=>ReadWriteLock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$async$2d$mutex$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/async-mutex/index.mjs [app-client] (ecmascript)");
;
var ReadWriteLock = class {
    constructor(){
        this.semaphore = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$async$2d$mutex$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Semaphore"](1);
        this.readers = 0;
        this.readersMutex = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$async$2d$mutex$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Semaphore"](1);
    }
    async withReadLock(callback) {
        await this._acquireReadLock();
        try {
            return await callback();
        } finally{
            await this._releaseReadLock();
        }
    }
    async withWriteLock(callback) {
        await this._acquireWriteLock();
        try {
            return await callback();
        } finally{
            await this._releaseWriteLock();
        }
    }
    async _acquireReadLock() {
        await this.readersMutex.acquire();
        try {
            this.readers += 1;
            if (this.readers === 1) {
                await this.semaphore.acquire();
            }
        } finally{
            this.readersMutex.release();
        }
    }
    async _releaseReadLock() {
        await this.readersMutex.acquire();
        try {
            this.readers -= 1;
            if (this.readers === 0) {
                this.semaphore.release();
            }
        } finally{
            this.readersMutex.release();
        }
    }
    async _acquireWriteLock() {
        await this.semaphore.acquire();
    }
    async _releaseWriteLock() {
        this.semaphore.release();
    }
};
;
 //# sourceMappingURL=locks.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/stores.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/stores.tsx
__turbopack_context__.s([
    "AsyncStore",
    ()=>AsyncStore,
    "Store",
    ()=>Store,
    "storeLock",
    ()=>storeLock
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$locks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/locks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/uuids.js [app-client] (ecmascript)");
;
;
;
;
var Store = class {
    constructor(_value){
        this._value = _value;
        this._callbacks = /* @__PURE__ */ new Map();
    }
    get() {
        return this._value;
    }
    set(value) {
        const oldValue = this._value;
        this._value = value;
        this._callbacks.forEach((callback)=>callback(value, oldValue));
    }
    update(updater) {
        const value = updater(this._value);
        this.set(value);
        return value;
    }
    onChange(callback) {
        const uuid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUuid"])();
        this._callbacks.set(uuid, callback);
        return {
            unsubscribe: ()=>{
                this._callbacks.delete(uuid);
            }
        };
    }
    onceChange(callback) {
        const { unsubscribe } = this.onChange((...args)=>{
            unsubscribe();
            callback(...args);
        });
        return {
            unsubscribe
        };
    }
};
var storeLock = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$locks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ReadWriteLock"]();
var AsyncStore = class _AsyncStore {
    constructor(...args){
        this._mostRecentOkValue = void 0;
        this._isRejected = false;
        this._waitingRejectFunctions = /* @__PURE__ */ new Map();
        this._callbacks = /* @__PURE__ */ new Map();
        this._updateCounter = 0;
        this._lastSuccessfulUpdate = -1;
        if (args.length === 0) {
            this._isAvailable = false;
        } else {
            this._isAvailable = true;
            this._mostRecentOkValue = args[0];
        }
    }
    isAvailable() {
        return this._isAvailable;
    }
    isRejected() {
        return this._isRejected;
    }
    get() {
        if (this.isRejected()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncResult"].error(this._rejectionError);
        } else if (this.isAvailable()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncResult"].ok(this._mostRecentOkValue);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncResult"].pending();
        }
    }
    getOrWait() {
        const uuid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUuid"])();
        if (this.isRejected()) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rejected"])(this._rejectionError);
        } else if (this.isAvailable()) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolved"])(this._mostRecentOkValue);
        }
        const promise = new Promise((resolve, reject)=>{
            this.onceChange((value)=>{
                resolve(value);
            });
            this._waitingRejectFunctions.set(uuid, reject);
        });
        const withFinally = promise.finally(()=>{
            this._waitingRejectFunctions.delete(uuid);
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pending"])(withFinally);
    }
    _setIfLatest(result, curCounter) {
        const oldState = this.get();
        const oldValue = this._mostRecentOkValue;
        if (curCounter > this._lastSuccessfulUpdate) {
            switch(result.status){
                case "ok":
                    {
                        if (!this._isAvailable || this._isRejected || this._mostRecentOkValue !== result.data) {
                            this._lastSuccessfulUpdate = curCounter;
                            this._isAvailable = true;
                            this._isRejected = false;
                            this._mostRecentOkValue = result.data;
                            this._rejectionError = void 0;
                            this._callbacks.forEach((callback)=>callback({
                                    state: this.get(),
                                    oldState,
                                    lastOkValue: oldValue
                                }));
                            return true;
                        }
                        return false;
                    }
                case "error":
                    {
                        this._lastSuccessfulUpdate = curCounter;
                        this._isAvailable = false;
                        this._isRejected = true;
                        this._rejectionError = result.error;
                        this._waitingRejectFunctions.forEach((reject)=>reject(result.error));
                        this._callbacks.forEach((callback)=>callback({
                                state: this.get(),
                                oldState,
                                lastOkValue: oldValue
                            }));
                        return true;
                    }
            }
        }
        return false;
    }
    set(value) {
        this._setIfLatest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(value), ++this._updateCounter);
    }
    update(updater) {
        const value = updater(this._mostRecentOkValue);
        this.set(value);
        return value;
    }
    async setAsync(promise) {
        return await storeLock.withReadLock(async ()=>{
            const curCounter = ++this._updateCounter;
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromPromise(promise);
            return this._setIfLatest(result, curCounter);
        });
    }
    setUnavailable() {
        this._lastSuccessfulUpdate = ++this._updateCounter;
        this._isAvailable = false;
        this._isRejected = false;
        this._rejectionError = void 0;
    }
    setRejected(error) {
        this._setIfLatest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(error), ++this._updateCounter);
    }
    map(mapper) {
        const store = new _AsyncStore();
        this.onChange((value)=>{
            store.set(mapper(value));
        });
        return store;
    }
    onChange(callback) {
        return this.onStateChange(({ state, lastOkValue })=>{
            if (state.status === "ok") {
                callback(state.data, lastOkValue);
            }
        });
    }
    onStateChange(callback) {
        const uuid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$uuids$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateUuid"])();
        this._callbacks.set(uuid, callback);
        return {
            unsubscribe: ()=>{
                this._callbacks.delete(uuid);
            }
        };
    }
    onceChange(callback) {
        const { unsubscribe } = this.onChange((...args)=>{
            unsubscribe();
            callback(...args);
        });
        return {
            unsubscribe
        };
    }
    onceStateChange(callback) {
        const { unsubscribe } = this.onStateChange((...args)=>{
            unsubscribe();
            callback(...args);
        });
        return {
            unsubscribe
        };
    }
};
;
 //# sourceMappingURL=stores.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/sessions.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/sessions.ts
__turbopack_context__.s([
    "AccessToken",
    ()=>AccessToken,
    "InternalSession",
    ()=>InternalSession,
    "RefreshToken",
    ()=>RefreshToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$node_modules$2f$jose$2f$dist$2f$browser$2f$util$2f$decode_jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/node_modules/jose/dist/browser/util/decode_jwt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$schema$2d$fields$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/schema-fields.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/stores.js [app-client] (ecmascript)");
;
;
;
;
function decodeAccessTokenIfValid(token) {
    try {
        const payload = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$node_modules$2f$jose$2f$dist$2f$browser$2f$util$2f$decode_jwt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decodeJwt"](token);
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$schema$2d$fields$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["accessTokenPayloadSchema"].validateSync(payload);
    } catch (e) {
        return null;
    }
}
var AccessToken = class _AccessToken {
    constructor(token){
        this.token = token;
        if (token === "undefined") {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Access token is the string 'undefined'; it's unlikely this is the correct value. They're supposed to be unguessable!");
        }
    }
    static createIfValid(token) {
        const payload = decodeAccessTokenIfValid(token);
        if (!payload) return null;
        return new _AccessToken(token);
    }
    get payload() {
        return decodeAccessTokenIfValid(this.token) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Invalid access token in payload (should've been validated in createIfValid)", {
            token: this.token
        });
    }
    get expiresAt() {
        const { exp } = this.payload;
        if (exp === void 0) return /* @__PURE__ */ new Date(864e13);
        return new Date(exp * 1e3);
    }
    /**
   * @returns The number of milliseconds until the access token expires, or 0 if it has already expired.
   */ get expiresInMillis() {
        return Math.max(0, this.expiresAt.getTime() - Date.now());
    }
    isExpired() {
        return this.expiresInMillis <= 0;
    }
};
var RefreshToken = class {
    constructor(token){
        this.token = token;
        if (token === "undefined") {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Refresh token is the string 'undefined'; it's unlikely this is the correct value. They're supposed to be unguessable!");
        }
    }
};
var InternalSession = class _InternalSession {
    constructor(_options){
        this._options = _options;
        /**
     * Whether the session as a whole is known to be invalid (ie. both access and refresh tokens are invalid). Used as a cache to avoid making multiple requests to the server (sessions never go back to being valid after being invalidated).
     *
     * It is possible for the access token to be invalid but the refresh token to be valid, in which case the session is
     * still valid (just needs a refresh). It is also possible for the access token to be valid but the refresh token to
     * be invalid, in which case the session is also valid (eg. if the refresh token is null because the user only passed
     * in an access token, eg. in a server-side request handler).
     */ this._knownToBeInvalid = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"](false);
        this._refreshPromise = null;
        this._accessToken = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Store"](_options.accessToken ? AccessToken.createIfValid(_options.accessToken) : null);
        this._refreshToken = _options.refreshToken ? new RefreshToken(_options.refreshToken) : null;
        if (_options.accessToken === null && _options.refreshToken === null) {
            this._knownToBeInvalid.set(true);
        }
        this.sessionKey = _InternalSession.calculateSessionKey({
            accessToken: _options.accessToken ?? null,
            refreshToken: _options.refreshToken
        });
    }
    static calculateSessionKey(ofTokens) {
        if (ofTokens.refreshToken) {
            return `refresh-${ofTokens.refreshToken}`;
        } else if (ofTokens.accessToken) {
            return `access-${ofTokens.accessToken}`;
        } else {
            return "not-logged-in";
        }
    }
    isKnownToBeInvalid() {
        return this._knownToBeInvalid.get();
    }
    /**
   * Marks the session object as invalid, meaning that the refresh and access tokens can no longer be used.
   */ markInvalid() {
        this._accessToken.set(null);
        this._knownToBeInvalid.set(true);
    }
    onInvalidate(callback) {
        return this._knownToBeInvalid.onChange(()=>callback());
    }
    /**
   * Returns the access token if it is found in the cache and not expired yet, or null otherwise. Never fetches new tokens.
   */ getAccessTokenIfNotExpiredYet(minMillisUntilExpiration) {
        if (minMillisUntilExpiration > 6e4) {
            throw new Error(`Required access token expiry ${minMillisUntilExpiration}ms is too long; access tokens are too short to be used for more than 60s`);
        }
        const accessToken = this._getPotentiallyInvalidAccessTokenIfAvailable();
        if (!accessToken || accessToken.expiresInMillis < minMillisUntilExpiration) return null;
        return accessToken;
    }
    /**
   * Returns the access token if it is found in the cache, fetching it otherwise.
   *
   * This is usually the function you want to call to get an access token. Either set `minMillisUntilExpiration` to a reasonable value, or catch errors that occur if it expires, and call `markAccessTokenExpired` to mark the token as expired if so (after which a call to this function will always refetch the token).
   *
   * @returns null if the session is known to be invalid, cached tokens if they exist in the cache and the access token hasn't expired yet (the refresh token might still be invalid), or new tokens otherwise.
   */ async getOrFetchLikelyValidTokens(minMillisUntilExpiration) {
        const accessToken = this.getAccessTokenIfNotExpiredYet(minMillisUntilExpiration);
        if (!accessToken) {
            const newTokens = await this.fetchNewTokens();
            const expiresInMillis = newTokens?.accessToken.expiresInMillis;
            if (expiresInMillis && expiresInMillis < minMillisUntilExpiration) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Required access token expiry ${minMillisUntilExpiration}ms is too long; access tokens are too short when they're generated (${expiresInMillis}ms)`);
            }
            return newTokens;
        }
        return {
            accessToken,
            refreshToken: this._refreshToken
        };
    }
    /**
   * Fetches new tokens that are, at the time of fetching, guaranteed to be valid.
   *
   * The newly generated tokens are short-lived, so it's good practice not to rely on their validity (if possible). However, this function is useful in some cases where you only want to pass access tokens to a service, and you want to make sure said access token has the longest possible lifetime.
   *
   * In most cases, you should prefer `getOrFetchLikelyValidTokens`.
   *
   * @returns null if the session is known to be invalid, or new tokens otherwise (which, at the time of fetching, are guaranteed to be valid).
   */ async fetchNewTokens() {
        const accessToken = await this._getNewlyFetchedAccessToken();
        return accessToken ? {
            accessToken,
            refreshToken: this._refreshToken
        } : null;
    }
    markAccessTokenExpired(accessToken) {
        if (this._accessToken.get() === accessToken) {
            this._accessToken.set(null);
        }
    }
    /**
   * Note that a callback invocation with `null` does not mean the session has been invalidated; the access token may just have expired. Use `onInvalidate` to detect invalidation.
   */ onAccessTokenChange(callback) {
        return this._accessToken.onChange(callback);
    }
    /**
   * @returns An access token, which may be expired or expire soon, or null if it is known to be invalid.
   */ _getPotentiallyInvalidAccessTokenIfAvailable() {
        if (!this._refreshToken) return null;
        if (this.isKnownToBeInvalid()) return null;
        const accessToken = this._accessToken.get();
        if (accessToken && !accessToken.isExpired()) return accessToken;
        return null;
    }
    /**
   * You should prefer `_getOrFetchPotentiallyInvalidAccessToken` in almost all cases.
   *
   * @returns A newly fetched access token (never read from cache), or null if the session either does not represent a user or the session is invalid.
   */ async _getNewlyFetchedAccessToken() {
        if (!this._refreshToken) return null;
        if (this._knownToBeInvalid.get()) return null;
        if (!this._refreshPromise) {
            this._refreshAndSetRefreshPromise(this._refreshToken);
        }
        return await this._refreshPromise;
    }
    _refreshAndSetRefreshPromise(refreshToken) {
        let refreshPromise = this._options.refreshAccessTokenCallback(refreshToken).then((accessToken)=>{
            if (refreshPromise === this._refreshPromise) {
                this._refreshPromise = null;
                this._accessToken.set(accessToken);
                if (!accessToken) {
                    this.markInvalid();
                }
            }
            return accessToken;
        });
        this._refreshPromise = refreshPromise;
    }
};
;
 //# sourceMappingURL=sessions.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/client-interface.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/interface/client-interface.ts
__turbopack_context__.s([
    "StackClientInterface",
    ()=>StackClientInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/oauth4webapi/build/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$sessions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/sessions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/crypto.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/globals.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$http$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/http.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
var StackClientInterface = class {
    constructor(options){
        this.options = options;
    }
    get projectId() {
        return this.options.projectId;
    }
    getApiUrl() {
        return this.options.getBaseUrl() + "/api/v1";
    }
    async runNetworkDiagnostics(session, requestType) {
        const tryRequest = async (cb)=>{
            try {
                await cb();
                return "OK";
            } catch (e) {
                return `${e}`;
            }
        };
        const cfTrace = await tryRequest(async ()=>{
            const res = await fetch("https://1.1.1.1/cdn-cgi/trace");
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
            }
        });
        const apiRoot = session !== void 0 && requestType !== void 0 ? await tryRequest(async ()=>{
            const res = await this.sendClientRequestInner("/", {}, session, requestType);
            if (res.status === "error") {
                throw res.error;
            }
        }) : "Not tested";
        const baseUrlBackend = await tryRequest(async ()=>{
            const res = await fetch(new URL("/health", this.getApiUrl()));
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
            }
        });
        const prodDashboard = await tryRequest(async ()=>{
            const res = await fetch("https://app.stack-auth.com/health");
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
            }
        });
        const prodBackend = await tryRequest(async ()=>{
            const res = await fetch("https://api.stack-auth.com/health");
            if (!res.ok) {
                throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
            }
        });
        return {
            "navigator?.onLine": __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].navigator?.onLine,
            cfTrace,
            apiRoot,
            baseUrlBackend,
            prodDashboard,
            prodBackend
        };
    }
    async _createNetworkError(cause, session, requestType) {
        return new Error(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Stack Auth is unable to connect to the server. Please check your internet connection and try again.

      If the problem persists, please contact support and provide a screenshot of your entire browser console.

      ${cause}

      ${JSON.stringify(await this.runNetworkDiagnostics(session, requestType), null, 2)}
    `, {
            cause
        });
    }
    async _networkRetry(cb, session, requestType) {
        const retriedResult = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].retry(cb, 5, {
            exponentialDelayBase: 1e3
        });
        if (retriedResult.status === "error") {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].navigator && __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"].navigator.onLine === false) {
                throw new Error("You are offline. Please check your internet connection and try again. (window.navigator.onLine is false)", {
                    cause: retriedResult.error
                });
            }
            throw await this._createNetworkError(retriedResult.error, session, requestType);
        }
        return retriedResult.data;
    }
    async _networkRetryException(cb, session, requestType) {
        return await this._networkRetry(async ()=>await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].fromThrowingAsync(cb), session, requestType);
    }
    async fetchNewAccessToken(refreshToken) {
        if (!("publishableClientKey" in this.options)) {
            throw new Error("Admin session token is currently not supported for fetching new access token. Did you try to log in on a StackApp initiated with the admin session?");
        }
        const as = {
            issuer: this.options.getBaseUrl(),
            algorithm: "oauth2",
            token_endpoint: this.getApiUrl() + "/auth/oauth/token"
        };
        const client = {
            client_id: this.projectId,
            client_secret: this.options.publishableClientKey,
            token_endpoint_auth_method: "client_secret_post"
        };
        const response = await this._networkRetryException(async ()=>{
            const rawResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["refreshTokenGrantRequest"](as, client, refreshToken.token);
            const response2 = await this._processResponse(rawResponse);
            if (response2.status === "error") {
                const error = response2.error;
                if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].RefreshTokenError.isInstance(error)) {
                    return null;
                }
                throw error;
            }
            if (!response2.data.ok) {
                const body = await response2.data.text();
                throw new Error(`Failed to send refresh token request: ${response2.status} ${body}`);
            }
            return response2.data;
        });
        if (!response) return null;
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processRefreshTokenResponse"](as, client, response);
        if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOAuth2Error"](result)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("OAuth error", {
                result
            });
        }
        if (!result.access_token) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Access token not found in token endpoint response, this is weird!");
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$sessions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AccessToken"].createIfValid(result.access_token) ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Access token in fetchNewAccessToken is invalid, looks like the backend is returning an invalid token!", {
            result
        });
    }
    async sendClientRequest(path, requestOptions, session, requestType = "client") {
        session ??= this.createSession({
            refreshToken: null
        });
        return await this._networkRetry(()=>this.sendClientRequestInner(path, requestOptions, session, requestType), session, requestType);
    }
    createSession(options) {
        const session = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$sessions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InternalSession"]({
            refreshAccessTokenCallback: async (refreshToken)=>await this.fetchNewAccessToken(refreshToken),
            ...options
        });
        return session;
    }
    async sendClientRequestAndCatchKnownError(path, requestOptions, tokenStoreOrNull, errorsToCatch) {
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await this.sendClientRequest(path, requestOptions, tokenStoreOrNull));
        } catch (e) {
            for (const errorType of errorsToCatch){
                if (errorType.isInstance(e)) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
                }
            }
            throw e;
        }
    }
    async sendClientRequestInner(path, options, session, requestType) {
        let tokenObj = await session.getOrFetchLikelyValidTokens(2e4);
        let adminSession = "projectOwnerSession" in this.options ? this.options.projectOwnerSession : null;
        let adminTokenObj = adminSession ? await adminSession.getOrFetchLikelyValidTokens(2e4) : null;
        await this.options.prepareRequest?.();
        let url = this.getApiUrl() + path;
        if (url.endsWith("/")) {
            url = url.slice(0, -1);
        }
        const params = {
            /**
       * This fetch may be cross-origin, in which case we don't want to send cookies of the
       * original origin (this is the default behavior of `credentials`).
       *
       * To help debugging, also omit cookies on same-origin, so we don't accidentally
       * implement reliance on cookies anywhere.
       *
       * However, Cloudflare Workers don't actually support `credentials`, so we only set it
       * if Cloudflare-exclusive globals are not detected. https://github.com/cloudflare/workers-sdk/issues/2514
       */ ..."WebSocketPair" in __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"] ? {} : {
                credentials: "omit"
            },
            ...options,
            headers: {
                "X-Stack-Override-Error-Status": "true",
                "X-Stack-Project-Id": this.projectId,
                "X-Stack-Access-Type": requestType,
                "X-Stack-Client-Version": this.options.clientVersion,
                ...tokenObj ? {
                    "X-Stack-Access-Token": tokenObj.accessToken.token
                } : {},
                ...tokenObj?.refreshToken ? {
                    "X-Stack-Refresh-Token": tokenObj.refreshToken.token
                } : {},
                "X-Stack-Allow-Anonymous-User": "true",
                ..."publishableClientKey" in this.options ? {
                    "X-Stack-Publishable-Client-Key": this.options.publishableClientKey
                } : {},
                ...adminTokenObj ? {
                    "X-Stack-Admin-Access-Token": adminTokenObj.accessToken.token
                } : {},
                /**
         * Next.js until v15 would cache fetch requests by default, and forcefully disabling it was nearly impossible.
         *
         * This header is used to change the cache key and hence always disable it, because we do our own caching.
         *
         * When we drop support for Next.js <15, we may be able to remove this header, but please make sure that this is
         * the case (I haven't actually tested.)
         */ "X-Stack-Random-Nonce": (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$crypto$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateSecureRandomString"])(),
                // don't show a warning when proxying the API through ngrok (only relevant if the API url is an ngrok site)
                "ngrok-skip-browser-warning": "true",
                ...this.options.extraRequestHeaders,
                ...options.headers
            },
            /**
       * Cloudflare Workers does not support cache, so don't pass it there
       */ ..."WebSocketPair" in __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$globals$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["globalVar"] ? {} : {
                cache: "no-store"
            }
        };
        let rawRes;
        try {
            rawRes = await fetch(url, params);
        } catch (e) {
            if (e instanceof TypeError) {
                if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$http$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HTTP_METHODS"][params.method ?? "GET"].idempotent) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
                } else {
                    throw await this._createNetworkError(e, session, requestType);
                }
            }
            throw e;
        }
        const processedRes = await this._processResponse(rawRes);
        if (processedRes.status === "error") {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidAccessToken.isInstance(processedRes.error)) {
                if (!tokenObj) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Received invalid access token, but session is not logged in", {
                        tokenObj,
                        processedRes
                    });
                }
                session.markAccessTokenExpired(tokenObj.accessToken);
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(processedRes.error);
            }
            if (adminSession && (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].InvalidAdminAccessToken.isInstance(processedRes.error) || __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].ApiKeyNotFound.isInstance(processedRes.error))) {
                if (!adminTokenObj) {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Received invalid admin access token, but admin session is not logged in", {
                        adminTokenObj,
                        processedRes
                    });
                }
                adminSession.markAccessTokenExpired(adminTokenObj.accessToken);
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(processedRes.error);
            }
            throw processedRes.error;
        }
        const res = Object.assign(processedRes.data, {
            usedTokens: tokenObj
        });
        if (res.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(res);
        } else if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After");
            if (retryAfter !== null) {
                console.log(`Rate limited while sending request to ${url}. Will retry after ${retryAfter} seconds...`);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])(Number(retryAfter) * 1e3);
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new Error(`Rate limited, retrying after ${retryAfter} seconds`));
            }
            console.log(`Rate limited while sending request to ${url}, no retry-after header received. Retrying...`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(new Error("Rate limited, no retry-after header received"));
        } else {
            const error = await res.text();
            const errorObj = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](`Failed to send request to ${url}: ${res.status} ${error}`, {
                request: params,
                res,
                path
            });
            if (res.status === 508 && error.includes("INFINITE_LOOP_DETECTED")) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(errorObj);
            }
            throw errorObj;
        }
    }
    async _processResponse(rawRes) {
        let res = rawRes;
        if (rawRes.headers.has("x-stack-actual-status")) {
            const actualStatus = Number(rawRes.headers.get("x-stack-actual-status"));
            res = new Response(rawRes.body, {
                status: actualStatus,
                statusText: rawRes.statusText,
                headers: rawRes.headers
            });
        }
        if (res.headers.has("x-stack-known-error")) {
            const errorJson = await res.json();
            if (res.headers.get("x-stack-known-error") !== errorJson.code) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Mismatch between x-stack-known-error header and error code in body; the server's response is invalid");
            }
            const error = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownError"].fromJson(errorJson);
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(res);
    }
    async checkFeatureSupport(options) {
        const res = await this.sendClientRequest("/check-feature-support", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        }, null);
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"](await res.text());
    }
    async sendForgotPasswordEmail(email, callbackUrl) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/password/send-reset-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                callback_url: callbackUrl
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].UserNotFound
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        }
    }
    async sendVerificationEmail(email, callbackUrl, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/contact-channels/send-verification-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                callback_url: callbackUrl
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].EmailAlreadyVerified
        ]);
        if (res.status === "error") {
            return res.error;
        }
    }
    async sendMagicLinkEmail(email, callbackUrl) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/otp/send-sign-in-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                callback_url: callbackUrl
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].RedirectUrlNotWhitelisted
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await res.data.json());
        }
    }
    async resetPassword(options) {
        const res = await this.sendClientRequestAndCatchKnownError("onlyVerifyCode" in options ? "/auth/password/reset/check-code" : "/auth/password/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: options.code,
                ..."password" in options ? {
                    password: options.password
                } : {}
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].VerificationCodeError
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        }
    }
    async updatePassword(options, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/password/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                old_password: options.oldPassword,
                new_password: options.newPassword
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordConfirmationMismatch,
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordRequirementsNotMet
        ]);
        if (res.status === "error") {
            return res.error;
        }
    }
    async setPassword(options, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/password/set", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordRequirementsNotMet
        ]);
        if (res.status === "error") {
            return res.error;
        }
    }
    async verifyPasswordResetCode(code) {
        const res = await this.resetPassword({
            code,
            onlyVerifyCode: true
        });
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        }
    }
    async verifyEmail(code) {
        const res = await this.sendClientRequestAndCatchKnownError("/contact-channels/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].VerificationCodeError
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
        }
    }
    async initiatePasskeyRegistration(options, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/passkey/initiate-passkey-registration", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        }, session, []);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await res.data.json());
    }
    async registerPasskey(options, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/passkey/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyRegistrationFailed
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
    }
    async initiatePasskeyAuthentication(options, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/passkey/initiate-passkey-authentication", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(options)
        }, session, []);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await res.data.json());
    }
    async sendTeamInvitation(options) {
        await this.sendClientRequest("/team-invitations/send-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: options.email,
                team_id: options.teamId,
                callback_url: options.callbackUrl
            })
        }, options.session);
    }
    async acceptTeamInvitation(options) {
        const res = await this.sendClientRequestAndCatchKnownError(options.type === "check" ? "/team-invitations/accept/check-code" : options.type === "details" ? "/team-invitations/accept/details" : "/team-invitations/accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: options.code
            })
        }, options.session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].VerificationCodeError
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await res.data.json());
        }
    }
    async totpMfa(attemptCode, totp, session) {
        const res = await this.sendClientRequest("/auth/mfa/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code: attemptCode,
                type: "totp",
                totp
            })
        }, session);
        const result = await res.json();
        return {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            newUser: result.is_new_user
        };
    }
    async signInWithCredential(email, password, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/password/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].EmailPasswordMismatch
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token
        });
    }
    async signUpWithCredential(email, password, emailVerificationRedirectUrl, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/password/sign-up", {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                verification_callback_url: emailVerificationRedirectUrl
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].UserWithEmailAlreadyExists,
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordRequirementsNotMet
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token
        });
    }
    async signUpAnonymously(session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/anonymous/sign-up", {
            method: "POST"
        }, session, []);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token
        });
    }
    async signInWithMagicLink(code, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/otp/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].VerificationCodeError
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            newUser: result.is_new_user
        });
    }
    async signInWithMfa(totp, code, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/mfa/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "totp",
                totp,
                code
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].VerificationCodeError
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            newUser: result.is_new_user
        });
    }
    async signInWithPasskey(body, session) {
        const res = await this.sendClientRequestAndCatchKnownError("/auth/passkey/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasskeyAuthenticationFailed
        ]);
        if (res.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(res.error);
        }
        const result = await res.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok({
            accessToken: result.access_token,
            refreshToken: result.refresh_token
        });
    }
    async getOAuthUrl(options) {
        const updatedRedirectUrl = new URL(options.redirectUrl);
        for (const key of [
            "code",
            "state"
        ]){
            if (updatedRedirectUrl.searchParams.has(key)) {
                console.warn("Redirect URL already contains " + key + " parameter, removing it as it will be overwritten by the OAuth callback");
            }
            updatedRedirectUrl.searchParams.delete(key);
        }
        if (!("publishableClientKey" in this.options)) {
            throw new Error("Admin session token is currently not supported for OAuth");
        }
        const url = new URL(this.getApiUrl() + "/auth/oauth/authorize/" + options.provider.toLowerCase());
        url.searchParams.set("client_id", this.projectId);
        url.searchParams.set("client_secret", this.options.publishableClientKey);
        url.searchParams.set("redirect_uri", updatedRedirectUrl.toString());
        url.searchParams.set("scope", "legacy");
        url.searchParams.set("state", options.state);
        url.searchParams.set("grant_type", "authorization_code");
        url.searchParams.set("code_challenge", options.codeChallenge);
        url.searchParams.set("code_challenge_method", "S256");
        url.searchParams.set("response_type", "code");
        url.searchParams.set("type", options.type);
        url.searchParams.set("error_redirect_url", options.errorRedirectUrl);
        const tokens = await options.session.getOrFetchLikelyValidTokens(2e4);
        if (tokens) {
            url.searchParams.set("token", tokens.accessToken.token);
        }
        if (options.afterCallbackRedirectUrl) {
            url.searchParams.set("after_callback_redirect_url", options.afterCallbackRedirectUrl);
        }
        if (options.providerScope) {
            url.searchParams.set("provider_scope", options.providerScope);
        }
        return url.toString();
    }
    async callOAuthCallback(options) {
        if (!("publishableClientKey" in this.options)) {
            throw new Error("Admin session token is currently not supported for OAuth");
        }
        const as = {
            issuer: this.options.getBaseUrl(),
            algorithm: "oauth2",
            token_endpoint: this.getApiUrl() + "/auth/oauth/token"
        };
        const client = {
            client_id: this.projectId,
            client_secret: this.options.publishableClientKey,
            token_endpoint_auth_method: "client_secret_post"
        };
        const params = await this._networkRetryException(async ()=>__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateAuthResponse"](as, client, options.oauthParams, options.state));
        if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOAuth2Error"](params)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Error validating outer OAuth response", {
                params
            });
        }
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authorizationCodeGrantRequest"](as, client, params, options.redirectUri, options.codeVerifier);
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["processAuthorizationCodeOAuth2Response"](as, client, response);
        if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$oauth4webapi$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isOAuth2Error"](result)) {
            if ("code" in result && result.code === "MULTI_FACTOR_AUTHENTICATION_REQUIRED") {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].MultiFactorAuthenticationRequired(result.details.attempt_code);
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Outer OAuth error during authorization code response", {
                result
            });
        }
        return {
            newUser: result.is_new_user,
            afterCallbackRedirectUrl: result.after_callback_redirect_url,
            accessToken: result.access_token,
            refreshToken: result.refresh_token ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Refresh token not found in outer OAuth response")
        };
    }
    async signOut(session) {
        const tokenObj = await session.getOrFetchLikelyValidTokens(2e4);
        if (tokenObj) {
            const resOrError = await this.sendClientRequestAndCatchKnownError("/auth/sessions/current", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            }, session, [
                __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].RefreshTokenError
            ]);
            if (resOrError.status === "error") {
                if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].RefreshTokenError.isInstance(resOrError.error)) {} else {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Unexpected error", {
                        error: resOrError.error
                    });
                }
            } else {}
        }
        session.markInvalid();
    }
    async getClientUserByToken(session) {
        const responseOrError = await this.sendClientRequestAndCatchKnownError("/users/me", {}, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CannotGetOwnUserWithoutUser
        ]);
        if (responseOrError.status === "error") {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CannotGetOwnUserWithoutUser.isInstance(responseOrError.error)) {
                return null;
            } else {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Unexpected uncaught error", {
                    cause: responseOrError.error
                });
            }
        }
        const response = responseOrError.data;
        const user = await response.json();
        if (!user) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("User endpoint returned null; this should never happen");
        return user;
    }
    async listTeamInvitations(options, session) {
        const response = await this.sendClientRequest("/team-invitations?" + new URLSearchParams({
            team_id: options.teamId
        }), {}, session);
        const result = await response.json();
        return result.items;
    }
    async revokeTeamInvitation(invitationId, teamId, session) {
        await this.sendClientRequest(`/team-invitations/${invitationId}?team_id=${teamId}`, {
            method: "DELETE"
        }, session);
    }
    async listTeamMemberProfiles(options, session) {
        const response = await this.sendClientRequest("/team-member-profiles?" + new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            team_id: options.teamId,
            user_id: options.userId
        })), {}, session);
        const result = await response.json();
        return result.items;
    }
    async getTeamMemberProfile(options, session) {
        const response = await this.sendClientRequest(`/team-member-profiles/${options.teamId}/${options.userId}`, {}, session);
        return await response.json();
    }
    async leaveTeam(teamId, session) {
        await this.sendClientRequest(`/team-memberships/${teamId}/me`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, session);
    }
    async updateTeamMemberProfile(options, session) {
        await this.sendClientRequest(`/team-member-profiles/${options.teamId}/${options.userId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(options.profile)
        }, session);
    }
    async updateTeam(options, session) {
        await this.sendClientRequest(`/teams/${options.teamId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(options.data)
        }, session);
    }
    async listCurrentUserTeamPermissions(options, session) {
        const response = await this.sendClientRequest(`/team-permissions?team_id=${options.teamId}&user_id=me&recursive=${options.recursive}`, {}, session);
        const result = await response.json();
        return result.items;
    }
    async listCurrentUserProjectPermissions(options, session) {
        const response = await this.sendClientRequest(`/project-permissions?user_id=me&recursive=${options.recursive}`, {}, session);
        const result = await response.json();
        return result.items;
    }
    async listCurrentUserTeams(session) {
        const response = await this.sendClientRequest("/teams?user_id=me", {}, session);
        const result = await response.json();
        return result.items;
    }
    async getClientProject() {
        const responseOrError = await this.sendClientRequestAndCatchKnownError("/projects/current", {}, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].ProjectNotFound
        ]);
        if (responseOrError.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(responseOrError.error);
        }
        const response = responseOrError.data;
        const project = await response.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(project);
    }
    async updateClientUser(update, session) {
        await this.sendClientRequest("/users/me", {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(update)
        }, session);
    }
    async listProjects(session) {
        const response = await this.sendClientRequest("/internal/projects", {}, session);
        if (!response.ok) {
            throw new Error("Failed to list projects: " + response.status + " " + await response.text());
        }
        const json = await response.json();
        return json.items;
    }
    async createProject(project, session) {
        const fetchResponse = await this.sendClientRequest("/internal/projects", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(project)
        }, session);
        if (!fetchResponse.ok) {
            throw new Error("Failed to create project: " + fetchResponse.status + " " + await fetchResponse.text());
        }
        const json = await fetchResponse.json();
        return json;
    }
    async createProviderAccessToken(provider, scope, session) {
        const response = await this.sendClientRequest(`/connected-accounts/me/${provider}/access-token`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                scope
            })
        }, session);
        return await response.json();
    }
    async createClientTeam(data, session) {
        const response = await this.sendClientRequest("/teams", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session);
        return await response.json();
    }
    async deleteTeam(teamId, session) {
        await this.sendClientRequest(`/teams/${teamId}`, {
            method: "DELETE"
        }, session);
    }
    async deleteCurrentUser(session) {
        await this.sendClientRequest("/users/me", {
            method: "DELETE"
        }, session);
    }
    async createClientContactChannel(data, session) {
        const response = await this.sendClientRequest("/contact-channels", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session);
        return await response.json();
    }
    async updateClientContactChannel(id, data, session) {
        const response = await this.sendClientRequest(`/contact-channels/me/${id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session);
        return await response.json();
    }
    async deleteClientContactChannel(id, session) {
        await this.sendClientRequest(`/contact-channels/me/${id}`, {
            method: "DELETE"
        }, session);
    }
    async deleteSession(sessionId, session) {
        await this.sendClientRequest(`/auth/sessions/${sessionId}?user_id=me`, {
            method: "DELETE"
        }, session);
    }
    async listSessions(session) {
        const response = await this.sendClientRequest("/auth/sessions?user_id=me", {
            method: "GET"
        }, session);
        return await response.json();
    }
    async listClientContactChannels(session) {
        const response = await this.sendClientRequest("/contact-channels?user_id=me", {
            method: "GET"
        }, session);
        const json = await response.json();
        return json.items;
    }
    async sendCurrentUserContactChannelVerificationEmail(contactChannelId, callbackUrl, session) {
        const responseOrError = await this.sendClientRequestAndCatchKnownError(`/contact-channels/me/${contactChannelId}/send-verification-code`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                callback_url: callbackUrl
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].EmailAlreadyVerified
        ]);
        if (responseOrError.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(responseOrError.error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
    }
    async cliLogin(loginCode, refreshToken, session) {
        const responseOrError = await this.sendClientRequestAndCatchKnownError("/auth/cli/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                login_code: loginCode,
                refresh_token: refreshToken
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].SchemaError
        ]);
        if (responseOrError.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(responseOrError.error);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
    }
    async _getApiKeyRequestInfo(options) {
        if ("user_id" in options && "team_id" in options) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Cannot specify both user_id and team_id in _getApiKeyRequestInfo");
        }
        return {
            endpoint: "team_id" in options ? "/team-api-keys" : "/user-api-keys",
            queryParams: new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefinedOrNull"])(options))
        };
    }
    async listProjectApiKeys(options, session, requestType) {
        const sendRequest = (requestType === "client" ? this.sendClientRequest : this.sendServerRequest).bind(this);
        const { endpoint, queryParams } = await this._getApiKeyRequestInfo(options);
        const response = await sendRequest(`${endpoint}?${queryParams.toString()}`, {
            method: "GET"
        }, session, requestType);
        const json = await response.json();
        return json.items;
    }
    async createProjectApiKey(data, session, requestType) {
        const sendRequest = (requestType === "client" ? this.sendClientRequest : this.sendServerRequest).bind(this);
        const { endpoint } = await this._getApiKeyRequestInfo(data);
        const response = await sendRequest(`${endpoint}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session, requestType);
        return await response.json();
    }
    async getProjectApiKey(options, keyId, session, requestType) {
        const sendRequest = (requestType === "client" ? this.sendClientRequest : this.sendServerRequest).bind(this);
        const { endpoint, queryParams } = await this._getApiKeyRequestInfo(options);
        const response = await sendRequest(`${endpoint}/${keyId}?${queryParams.toString()}`, {
            method: "GET"
        }, session, requestType);
        return await response.json();
    }
    async updateProjectApiKey(options, keyId, data, session, requestType) {
        const sendRequest = (requestType === "client" ? this.sendClientRequest : this.sendServerRequest).bind(this);
        const { endpoint, queryParams } = await this._getApiKeyRequestInfo(options);
        const response = await sendRequest(`${endpoint}/${keyId}?${queryParams.toString()}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session, requestType);
        return await response.json();
    }
    async checkProjectApiKey(type, apiKey, session, requestType) {
        const sendRequest = (requestType === "client" ? this.sendClientRequestAndCatchKnownError : this.sendServerRequestAndCatchKnownError).bind(this);
        const result = await sendRequest(`/${type}-api-keys/check`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                api_key: apiKey
            })
        }, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].ApiKeyNotValid
        ]);
        if (result.status === "error") {
            return null;
        }
        return await result.data.json();
    }
    async listNotificationCategories(session) {
        const response = await this.sendClientRequest(`/emails/notification-preference/me`, {}, session);
        const result = await response.json();
        return result.items;
    }
    async setNotificationsEnabled(notificationCategoryId, enabled, session) {
        await this.sendClientRequest(`/emails/notification-preference/me/${notificationCategoryId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                enabled
            })
        }, session);
    }
    async getOAuthProvider(userId, providerId, session) {
        const response = await this.sendClientRequest(`/oauth-providers/${userId}/${providerId}`, {
            method: "GET"
        }, session);
        return await response.json();
    }
    async updateOAuthProvider(userId, providerId, data, session) {
        const response = await this.sendClientRequest(`/oauth-providers/${userId}/${providerId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, session);
        return await response.json();
    }
    async listOAuthProviders(options = {}, session) {
        const queryParams = new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])(options));
        const response = await this.sendClientRequest(`/oauth-providers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
            method: "GET"
        }, session);
        const result = await response.json();
        return result.items;
    }
    async deleteOAuthProvider(userId, providerId, session) {
        const response = await this.sendClientRequest(`/oauth-providers/${userId}/${providerId}`, {
            method: "DELETE"
        }, session);
        return await response.json();
    }
    async getItem(options, session) {
        let customerType;
        let customerId;
        if ("userId" in options) {
            customerType = "user";
            customerId = options.userId;
        } else if ("teamId" in options) {
            customerType = "team";
            customerId = options.teamId;
        } else if ("customCustomerId" in options) {
            customerType = "custom";
            customerId = options.customCustomerId;
        } else {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("getItem requires one of userId, teamId, or customCustomerId");
        }
        const response = await this.sendClientRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/payments/items/${customerType}/${customerId}/${options.itemId}`, {}, session);
        return await response.json();
    }
    async listProducts(options, session) {
        const queryParams = new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            cursor: options.cursor,
            limit: options.limit !== void 0 ? options.limit.toString() : void 0
        }));
        const path = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/payments/products/${options.customer_type}/${options.customer_id}`;
        const response = await this.sendClientRequest(`${path}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {}, session);
        return await response.json();
    }
    async createCheckoutUrl(customer_type, customer_id, productIdOrInline, session, returnUrl) {
        const productBody = typeof productIdOrInline === "string" ? {
            product_id: productIdOrInline
        } : {
            inline_product: productIdOrInline
        };
        const response = await this.sendClientRequest("/payments/purchases/create-purchase-url", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                customer_type,
                customer_id,
                ...productBody,
                return_url: returnUrl
            })
        }, session);
        const { url } = await response.json();
        return url;
    }
    async transferProject(internalProjectSession, projectIdToTransfer, newTeamId) {
        if (this.options.projectId !== "internal") {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("StackClientInterface.transferProject() is only available for internal projects (please specify the project ID in the constructor)");
        }
        await this.sendClientRequest("/internal/projects/transfer", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                project_id: projectIdToTransfer,
                new_team_id: newTeamId
            })
        }, internalProjectSession);
    }
};
;
 //# sourceMappingURL=client-interface.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/server-interface.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/interface/server-interface.ts
__turbopack_context__.s([
    "StackServerInterface",
    ()=>StackServerInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$vault$2f$client$2d$side$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/helpers/vault/client-side.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$client$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/client-interface.js [app-client] (ecmascript)");
;
;
;
;
;
;
;
var StackServerInterface = class extends __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$client$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackClientInterface"] {
    constructor(options){
        super(options);
        this.options = options;
    }
    async sendServerRequest(path, options, session, requestType = "server") {
        return await this.sendClientRequest(path, {
            ...options,
            headers: {
                "x-stack-secret-server-key": "secretServerKey" in this.options ? this.options.secretServerKey : "",
                ...options.headers
            }
        }, session, requestType);
    }
    async sendServerRequestAndCatchKnownError(path, requestOptions, tokenStoreOrNull, errorsToCatch) {
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await this.sendServerRequest(path, requestOptions, tokenStoreOrNull));
        } catch (e) {
            for (const errorType of errorsToCatch){
                if (errorType.isInstance(e)) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
                }
            }
            throw e;
        }
    }
    async createServerUser(data) {
        const response = await this.sendServerRequest("/users", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async getServerUserByToken(session) {
        const responseOrError = await this.sendServerRequestAndCatchKnownError("/users/me", {}, session, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CannotGetOwnUserWithoutUser
        ]);
        if (responseOrError.status === "error") {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].CannotGetOwnUserWithoutUser.isInstance(responseOrError.error)) {
                return null;
            } else {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Unexpected uncaught error", {
                    cause: responseOrError.error
                });
            }
        }
        const response = responseOrError.data;
        const user = await response.json();
        if (!user) throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("User endpoint returned null; this should never happen");
        return user;
    }
    async getServerUserById(userId) {
        const responseOrError = await this.sendServerRequestAndCatchKnownError(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/users/${userId}`, {}, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].UserNotFound
        ]);
        if (responseOrError.status === "error") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(responseOrError.error);
        }
        const user = await responseOrError.data.json();
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(user);
    }
    async listServerTeamInvitations(options) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-invitations?team_id=${options.teamId}`, {}, null);
        const result = await response.json();
        return result.items;
    }
    async revokeServerTeamInvitation(invitationId, teamId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-invitations/${invitationId}?team_id=${teamId}`, {
            method: "DELETE"
        }, null);
    }
    async listServerTeamMemberProfiles(options) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-member-profiles?team_id=${options.teamId}`, {}, null);
        const result = await response.json();
        return result.items;
    }
    async getServerTeamMemberProfile(options) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-member-profiles/${options.teamId}/${options.userId}`, {}, null);
        return await response.json();
    }
    async listServerTeamPermissions(options, session) {
        const response = await this.sendServerRequest(`/team-permissions?${new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            user_id: options.userId,
            team_id: options.teamId,
            recursive: options.recursive.toString()
        }))}`, {}, session);
        const result = await response.json();
        return result.items;
    }
    async listServerProjectPermissions(options, session) {
        const response = await this.sendServerRequest(`/project-permissions?${new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            user_id: options.userId,
            recursive: options.recursive.toString()
        }))}`, {}, session);
        const result = await response.json();
        return result.items;
    }
    async listServerUsers(options) {
        const searchParams = new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            cursor: options.cursor,
            limit: options.limit?.toString(),
            desc: options.desc?.toString(),
            ...options.orderBy ? {
                order_by: ({
                    signedUpAt: "signed_up_at"
                })[options.orderBy]
            } : {},
            ...options.query ? {
                query: options.query
            } : {},
            ...options.includeAnonymous ? {
                include_anonymous: "true"
            } : {}
        }));
        const response = await this.sendServerRequest("/users?" + searchParams.toString(), {}, null);
        return await response.json();
    }
    async listServerTeams(options) {
        const response = await this.sendServerRequest(`/teams?${new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            user_id: options?.userId
        }))}`, {}, null);
        const result = await response.json();
        return result.items;
    }
    async getServerTeam(teamId) {
        const response = await this.sendServerRequest(`/teams/${teamId}`, {}, null);
        return await response.json();
    }
    async listServerTeamUsers(teamId) {
        const response = await this.sendServerRequest(`/users?team_id=${teamId}`, {}, null);
        const result = await response.json();
        return result.items;
    }
    /* when passing a session, the user will be added to the team */ async createServerTeam(data) {
        const response = await this.sendServerRequest("/teams", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async updateServerTeam(teamId, data) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/teams/${teamId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async deleteServerTeam(teamId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/teams/${teamId}`, {
            method: "DELETE"
        }, null);
    }
    async addServerUserToTeam(options) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-memberships/${options.teamId}/${options.userId}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
        return await response.json();
    }
    async removeServerUserFromTeam(options) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-memberships/${options.teamId}/${options.userId}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async updateServerUser(userId, update) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/users/${userId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(update)
        }, null);
        return await response.json();
    }
    async createServerProviderAccessToken(userId, provider, scope) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/connected-accounts/${userId}/${provider}/access-token`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                scope
            })
        }, null);
        return await response.json();
    }
    async createServerUserSession(userId, expiresInMillis, isImpersonation) {
        const response = await this.sendServerRequest("/auth/sessions", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                user_id: userId,
                expires_in_millis: expiresInMillis,
                is_impersonation: isImpersonation
            })
        }, null);
        const result = await response.json();
        return {
            accessToken: result.access_token,
            refreshToken: result.refresh_token
        };
    }
    async leaveServerTeam(options) {
        await this.sendClientRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-memberships/${options.teamId}/${options.userId}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async updateServerTeamMemberProfile(options) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-member-profiles/${options.teamId}/${options.userId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(options.profile)
        }, null);
    }
    async grantServerTeamUserPermission(teamId, userId, permissionId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-permissions/${teamId}/${userId}/${permissionId}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async grantServerProjectPermission(userId, permissionId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/project-permissions/${userId}/${permissionId}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async revokeServerTeamUserPermission(teamId, userId, permissionId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/team-permissions/${teamId}/${userId}/${permissionId}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async revokeServerProjectPermission(userId, permissionId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/project-permissions/${userId}/${permissionId}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async deleteServerUser(userId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/users/${userId}`, {
            method: "DELETE",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
    }
    async createServerContactChannel(data) {
        const response = await this.sendServerRequest("/contact-channels", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async updateServerContactChannel(userId, contactChannelId, data) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/contact-channels/${userId}/${contactChannelId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async deleteServerContactChannel(userId, contactChannelId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/contact-channels/${userId}/${contactChannelId}`, {
            method: "DELETE"
        }, null);
    }
    async listServerContactChannels(userId) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/contact-channels?user_id=${userId}`, {
            method: "GET"
        }, null);
        const json = await response.json();
        return json.items;
    }
    async listServerNotificationCategories(userId) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/emails/notification-preference/${userId}`, {
            method: "GET"
        }, null);
        const json = await response.json();
        return json.items;
    }
    async setServerNotificationsEnabled(userId, notificationCategoryId, enabled) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/emails/notification-preference/${userId}/${notificationCategoryId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                enabled
            })
        }, null);
    }
    async sendServerContactChannelVerificationEmail(userId, contactChannelId, callbackUrl) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/contact-channels/${userId}/${contactChannelId}/send-verification-code`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                callback_url: callbackUrl
            })
        }, null);
    }
    async listServerSessions(userId) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/auth/sessions?user_id=${userId}`, {
            method: "GET"
        }, null);
        return await response.json();
    }
    async deleteServerSession(sessionId) {
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/auth/sessions/${sessionId}`, {
            method: "DELETE"
        }, null);
    }
    async sendServerTeamInvitation(options) {
        await this.sendServerRequest("/team-invitations/send-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: options.email,
                team_id: options.teamId,
                callback_url: options.callbackUrl
            })
        }, null);
    }
    async updatePassword(options) {
        const res = await this.sendServerRequestAndCatchKnownError("/auth/password/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                old_password: options.oldPassword,
                new_password: options.newPassword
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordConfirmationMismatch,
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].PasswordRequirementsNotMet
        ]);
        if (res.status === "error") {
            return res.error;
        }
    }
    // OAuth Providers CRUD operations
    async createServerOAuthProvider(data) {
        const response = await this.sendServerRequest("/oauth-providers", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async listServerOAuthProviders(options = {}) {
        const queryParams = new URLSearchParams((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])(options));
        const response = await this.sendServerRequest(`/oauth-providers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
            method: "GET"
        }, null);
        const result = await response.json();
        return result.items;
    }
    async updateServerOAuthProvider(userId, providerId, data) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/oauth-providers/${userId}/${providerId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async deleteServerOAuthProvider(userId, providerId) {
        const response = await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/oauth-providers/${userId}/${providerId}`, {
            method: "DELETE"
        }, null);
        return await response.json();
    }
    async sendEmail(options) {
        const res = await this.sendServerRequest("/emails/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_ids: options.userIds,
                all_users: options.allUsers,
                theme_id: options.themeId,
                html: options.html,
                subject: options.subject,
                notification_category_name: options.notificationCategoryName,
                template_id: options.templateId,
                variables: options.variables,
                draft_id: options.draftId
            })
        }, null);
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(void 0);
    }
    async updateItemQuantity(options, data) {
        let customerType;
        let customerId;
        const itemId = options.itemId;
        if ("userId" in options) {
            customerType = "user";
            customerId = options.userId;
        } else if ("teamId" in options) {
            customerType = "team";
            customerId = options.teamId;
        } else if ("customCustomerId" in options) {
            customerType = "custom";
            customerId = options.customCustomerId;
        } else {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("updateItemQuantity requires one of userId, teamId, or customCustomerId");
        }
        const queryParams = new URLSearchParams({
            allow_negative: (data.allow_negative ?? false).toString()
        });
        await this.sendServerRequest(`/payments/items/${customerType}/${customerId}/${itemId}/update-quantity?${queryParams.toString()}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                delta: data.delta,
                expires_at: data.expires_at,
                description: data.description
            })
        }, null);
    }
    async grantProduct(options) {
        if (!options.productId && !options.product) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("grantProduct requires either productId or product");
        }
        if (options.productId && options.product) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("grantProduct should not receive both productId and product");
        }
        const body = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])({
            product_id: options.productId,
            product_inline: options.product,
            quantity: options.quantity
        });
        await this.sendServerRequest(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["urlString"]`/payments/products/${options.customerType}/${options.customerId}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(body)
        }, null);
    }
    async getDataVaultStoreValue(secret, storeId, key) {
        const hashedKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$vault$2f$client$2d$side$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hashKey"])(secret, key);
        const response = await this.sendServerRequestAndCatchKnownError(`/data-vault/stores/${storeId}/get`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                hashed_key: hashedKey
            })
        }, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].DataVaultStoreHashedKeyDoesNotExist
        ]);
        if (response.status === "error") {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].DataVaultStoreHashedKeyDoesNotExist.isInstance(response.error)) {
                return null;
            } else {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Unexpected uncaught error", {
                    cause: response.error
                });
            }
        }
        const json = await response.data.json();
        const encryptedValue = json.encrypted_value;
        if (typeof encryptedValue !== "string") throw new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("encrypted_value is not a string", {
            type: typeof encryptedValue
        });
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$vault$2f$client$2d$side$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["decryptValue"])(secret, key, encryptedValue);
    }
    async setDataVaultStoreValue(secret, storeId, key, value) {
        const hashedKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$vault$2f$client$2d$side$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hashKey"])(secret, key);
        const encryptedValue = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$helpers$2f$vault$2f$client$2d$side$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["encryptValue"])(secret, key, value);
        await this.sendServerRequest(`/data-vault/stores/${storeId}/set`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                hashed_key: hashedKey,
                encrypted_value: encryptedValue
            })
        }, null);
    }
};
;
 //# sourceMappingURL=server-interface.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/admin-interface.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/interface/admin-interface.ts
__turbopack_context__.s([
    "StackAdminInterface",
    ()=>StackAdminInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/results.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$server$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/server-interface.js [app-client] (ecmascript)");
;
;
;
var StackAdminInterface = class extends __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$server$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackServerInterface"] {
    constructor(options){
        super(options);
        this.options = options;
    }
    async sendAdminRequest(path, options, session, requestType = "admin") {
        return await this.sendServerRequest(path, {
            ...options,
            headers: {
                "x-stack-super-secret-admin-key": "superSecretAdminKey" in this.options ? this.options.superSecretAdminKey : "",
                ...options.headers
            }
        }, session, requestType);
    }
    async sendAdminRequestAndCatchKnownError(path, requestOptions, tokenStoreOrNull, errorsToCatch) {
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].ok(await this.sendAdminRequest(path, requestOptions, tokenStoreOrNull));
        } catch (e) {
            for (const errorType of errorsToCatch){
                if (errorType.isInstance(e)) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$results$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Result"].error(e);
                }
            }
            throw e;
        }
    }
    async getProject() {
        const response = await this.sendAdminRequest("/internal/projects/current", {
            method: "GET"
        }, null);
        return await response.json();
    }
    async updateProject(update) {
        const response = await this.sendAdminRequest("/internal/projects/current", {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(update)
        }, null);
        return await response.json();
    }
    async createInternalApiKey(options) {
        const response = await this.sendAdminRequest("/internal/api-keys", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(options)
        }, null);
        return await response.json();
    }
    async listInternalApiKeys() {
        const response = await this.sendAdminRequest("/internal/api-keys", {}, null);
        const result = await response.json();
        return result.items;
    }
    async revokeInternalApiKeyById(id) {
        await this.sendAdminRequest(`/internal/api-keys/${id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                revoked: true
            })
        }, null);
    }
    async getInternalApiKey(id, session) {
        const response = await this.sendAdminRequest(`/internal/api-keys/${id}`, {}, session);
        return await response.json();
    }
    async listInternalEmailTemplates() {
        const response = await this.sendAdminRequest(`/internal/email-templates`, {}, null);
        const result = await response.json();
        return result.templates;
    }
    async listInternalEmailDrafts() {
        const response = await this.sendAdminRequest(`/internal/email-drafts`, {}, null);
        const result = await response.json();
        return result.drafts;
    }
    async createEmailDraft(options) {
        const response = await this.sendAdminRequest(`/internal/email-drafts`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(options)
        }, null);
        return await response.json();
    }
    async updateEmailDraft(id, data) {
        await this.sendAdminRequest(`/internal/email-drafts/${id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
    }
    async listEmailThemes() {
        const response = await this.sendAdminRequest(`/internal/email-themes`, {}, null);
        const result = await response.json();
        return result.themes;
    }
    // Team permission definitions methods
    async listTeamPermissionDefinitions() {
        const response = await this.sendAdminRequest(`/team-permission-definitions`, {}, null);
        const result = await response.json();
        return result.items;
    }
    async createTeamPermissionDefinition(data) {
        const response = await this.sendAdminRequest("/team-permission-definitions", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async updateTeamPermissionDefinition(permissionId, data) {
        const response = await this.sendAdminRequest(`/team-permission-definitions/${permissionId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async deleteTeamPermissionDefinition(permissionId) {
        await this.sendAdminRequest(`/team-permission-definitions/${permissionId}`, {
            method: "DELETE"
        }, null);
    }
    async listProjectPermissionDefinitions() {
        const response = await this.sendAdminRequest(`/project-permission-definitions`, {}, null);
        const result = await response.json();
        return result.items;
    }
    async createProjectPermissionDefinition(data) {
        const response = await this.sendAdminRequest("/project-permission-definitions", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async updateProjectPermissionDefinition(permissionId, data) {
        const response = await this.sendAdminRequest(`/project-permission-definitions/${permissionId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async deleteProjectPermissionDefinition(permissionId) {
        await this.sendAdminRequest(`/project-permission-definitions/${permissionId}`, {
            method: "DELETE"
        }, null);
    }
    async getSvixToken() {
        const response = await this.sendAdminRequest("/webhooks/svix-token", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
        return await response.json();
    }
    async deleteProject() {
        await this.sendAdminRequest("/internal/projects/current", {
            method: "DELETE"
        }, null);
    }
    async getMetrics(includeAnonymous = false) {
        const params = new URLSearchParams();
        if (includeAnonymous) {
            params.append("include_anonymous", "true");
        }
        const queryString = params.toString();
        const response = await this.sendAdminRequest(`/internal/metrics${queryString ? `?${queryString}` : ""}`, {
            method: "GET"
        }, null);
        return await response.json();
    }
    async sendTestEmail(data) {
        const response = await this.sendAdminRequest(`/internal/send-test-email`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }, null);
        return await response.json();
    }
    async listSentEmails() {
        const response = await this.sendAdminRequest("/internal/emails", {
            method: "GET"
        }, null);
        return await response.json();
    }
    async sendSignInInvitationEmail(email, callbackUrl) {
        await this.sendAdminRequest("/internal/send-sign-in-invitation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                callback_url: callbackUrl
            })
        }, null);
    }
    async sendChatMessage(threadId, contextType, messages, abortSignal) {
        const response = await this.sendAdminRequest(`/internal/ai-chat/${threadId}`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                context_type: contextType,
                messages
            }),
            signal: abortSignal
        }, null);
        return await response.json();
    }
    async saveChatMessage(threadId, message) {
        await this.sendAdminRequest(`/internal/ai-chat/${threadId}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                message
            })
        }, null);
    }
    async listChatMessages(threadId) {
        const response = await this.sendAdminRequest(`/internal/ai-chat/${threadId}`, {
            method: "GET"
        }, null);
        return await response.json();
    }
    async renderEmailPreview(options) {
        const response = await this.sendAdminRequest(`/emails/render-email`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                theme_id: options.themeId,
                theme_tsx_source: options.themeTsxSource,
                template_id: options.templateId,
                template_tsx_source: options.templateTsxSource
            })
        }, null);
        return await response.json();
    }
    async createEmailTheme(displayName) {
        const response = await this.sendAdminRequest(`/internal/email-themes`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                display_name: displayName
            })
        }, null);
        return await response.json();
    }
    async getEmailTheme(id) {
        const response = await this.sendAdminRequest(`/internal/email-themes/${id}`, {
            method: "GET"
        }, null);
        return await response.json();
    }
    async updateEmailTheme(id, tsxSource) {
        await this.sendAdminRequest(`/internal/email-themes/${id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                tsx_source: tsxSource
            })
        }, null);
    }
    async updateEmailTemplate(id, tsxSource, themeId) {
        const response = await this.sendAdminRequest(`/internal/email-templates/${id}`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                tsx_source: tsxSource,
                theme_id: themeId
            })
        }, null);
        return await response.json();
    }
    async getConfig() {
        const response = await this.sendAdminRequest(`/internal/config`, {
            method: "GET"
        }, null);
        return await response.json();
    }
    async updateConfig(data) {
        const response = await this.sendAdminRequest(`/internal/config/override`, {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                config_override_string: JSON.stringify(data.configOverride)
            })
        }, null);
        return await response.json();
    }
    async createEmailTemplate(displayName) {
        const response = await this.sendAdminRequest(`/internal/email-templates`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                display_name: displayName
            })
        }, null);
        return await response.json();
    }
    async setupPayments() {
        const response = await this.sendAdminRequest("/internal/payments/setup", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
        return await response.json();
    }
    async getStripeAccountInfo() {
        const response = await this.sendAdminRequestAndCatchKnownError("/internal/payments/stripe/account-info", {}, null, [
            __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KnownErrors"].StripeAccountInfoNotFound
        ]);
        if (response.status === "error") {
            return null;
        }
        return await response.data.json();
    }
    async createStripeWidgetAccountSession() {
        const response = await this.sendAdminRequest("/internal/payments/stripe-widgets/account-session", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({})
        }, null);
        return await response.json();
    }
    async listTransactions(params) {
        const qs = new URLSearchParams();
        if (params?.cursor) qs.set("cursor", params.cursor);
        if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
        if (params?.type) qs.set("type", params.type);
        if (params?.customerType) qs.set("customer_type", params.customerType);
        const response = await this.sendAdminRequest(`/internal/payments/transactions${qs.size ? `?${qs.toString()}` : ""}`, {
            method: "GET"
        }, null);
        const json = await response.json();
        return {
            transactions: json.transactions,
            nextCursor: json.next_cursor
        };
    }
};
;
 //# sourceMappingURL=admin-interface.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/index.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// src/index.ts
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$admin$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/admin-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$client$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/client-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$interface$2f$server$2d$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/interface/server-interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$known$2d$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/known-errors.js [app-client] (ecmascript)");
;
;
;
;
;
 //# sourceMappingURL=index.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/helpers/production-mode.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/helpers/production-mode.ts
__turbopack_context__.s([
    "getProductionModeErrors",
    ()=>getProductionModeErrors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/urls.js [app-client] (ecmascript)");
;
;
function getProductionModeErrors(project) {
    const errors = [];
    const domainsFixUrl = `/projects/${project.id}/domains`;
    if (project.config.allow_localhost) {
        errors.push({
            message: "Localhost is not allowed in production mode, turn off 'Allow localhost' in project settings",
            relativeFixUrl: domainsFixUrl
        });
    }
    for (const { domain } of project.config.domains){
        let url;
        try {
            const normalizedDomain = domain.replace(/\*+/g, "wildcard-placeholder");
            url = new URL(normalizedDomain);
        } catch (e) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["captureError"])("production-mode-domain-not-valid", new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StackAssertionError"]("Domain was somehow not a valid URL; we should've caught this when setting the domain in the first place", {
                domain,
                projectId: project
            }));
            errors.push({
                message: "Trusted domain is not a valid URL: " + domain,
                relativeFixUrl: domainsFixUrl
            });
            continue;
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$urls$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isLocalhost"])(url)) {
            errors.push({
                message: "Localhost domains are not allowed to be trusted in production mode: " + domain,
                relativeFixUrl: domainsFixUrl
            });
        } else if (url.hostname.match(/^\d+(\.\d+)*$/)) {
            errors.push({
                message: "Direct IPs are not valid for trusted domains in production mode: " + domain,
                relativeFixUrl: domainsFixUrl
            });
        } else if (url.protocol !== "https:") {
            errors.push({
                message: "Trusted domains should be HTTPS: " + domain,
                relativeFixUrl: domainsFixUrl
            });
        }
    }
    return errors;
}
;
 //# sourceMappingURL=production-mode.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/caches.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/caches.tsx
__turbopack_context__.s([
    "AsyncCache",
    ()=>AsyncCache,
    "cacheFunction",
    ()=>cacheFunction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/maps.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/objects.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/stores.js [app-client] (ecmascript)");
;
;
;
;
function cacheFunction(f) {
    const dependenciesMap = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DependenciesMap"]();
    return (...args)=>{
        if (dependenciesMap.has(args)) {
            return dependenciesMap.get(args);
        }
        const value = f(...args);
        dependenciesMap.set(args, value);
        return value;
    };
}
var AsyncCache = class {
    constructor(_fetcher, _options = {}){
        this._fetcher = _fetcher;
        this._options = _options;
        this._map = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$maps$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DependenciesMap"]();
        this.isCacheAvailable = this._createKeyed("isCacheAvailable");
        this.getIfCached = this._createKeyed("getIfCached");
        this.getOrWait = this._createKeyed("getOrWait");
        this.forceSetCachedValue = this._createKeyed("forceSetCachedValue");
        this.forceSetCachedValueAsync = this._createKeyed("forceSetCachedValueAsync");
        this.refresh = this._createKeyed("refresh");
        this.invalidate = this._createKeyed("invalidate");
        this.onStateChange = this._createKeyed("onStateChange");
        this.isDirty = this._createKeyed("isDirty");
    }
    _createKeyed(functionName) {
        return (key, ...args)=>{
            const valueCache = this.getValueCache(key);
            return valueCache[functionName].apply(valueCache, args);
        };
    }
    getValueCache(dependencies) {
        let cache = this._map.get(dependencies);
        if (!cache) {
            cache = new AsyncValueCache(async ()=>await this._fetcher(dependencies), {
                ...this._options,
                onSubscribe: this._options.onSubscribe ? (cb)=>this._options.onSubscribe(dependencies, cb) : void 0
            });
            this._map.set(dependencies, cache);
        }
        return cache;
    }
    async refreshWhere(predicate) {
        const promises = [];
        for (const [dependencies, cache] of this._map){
            if (predicate(dependencies)) {
                promises.push(cache.refresh());
            }
        }
        await Promise.all(promises);
    }
};
var AsyncValueCache = class {
    constructor(fetcher, _options = {}){
        this._options = _options;
        this._subscriptionsCount = 0;
        this._unsubscribers = [];
        this._mostRecentRefreshPromiseIndex = 0;
        this._store = new __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$stores$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsyncStore"]();
        this._rateLimitOptions = {
            concurrency: 1,
            throttleMs: 300,
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$objects$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterUndefined"])(_options.rateLimiter ?? {})
        };
        this._fetcher = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rateLimited"])(fetcher, {
            ...this._rateLimitOptions,
            batchCalls: true
        });
    }
    isCacheAvailable() {
        return this._store.isAvailable();
    }
    getIfCached() {
        return this._store.get();
    }
    getOrWait(cacheStrategy) {
        const cached = this.getIfCached();
        if (cacheStrategy === "read-write" && cached.status === "ok") {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolved"])(cached.data);
        }
        return this._refetch(cacheStrategy);
    }
    _set(value) {
        this._store.set(value);
    }
    _setAsync(value) {
        const promise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pending"])(value);
        this._pendingPromise = promise;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pending"])(this._store.setAsync(promise));
    }
    _refetch(cacheStrategy) {
        if (cacheStrategy === "read-write" && this._pendingPromise) {
            return this._pendingPromise;
        }
        const promise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pending"])(this._fetcher());
        if (cacheStrategy === "never") {
            return promise;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pending"])(this._setAsync(promise).then(()=>promise));
    }
    forceSetCachedValue(value) {
        this._set(value);
    }
    forceSetCachedValueAsync(value) {
        return this._setAsync(value);
    }
    /**
   * Refetches the value from the fetcher, and updates the cache with it.
   */ async refresh() {
        return await this.getOrWait("write-only");
    }
    /**
   * Invalidates the cache, marking it dirty (ie. it will be refreshed on the next read). If anyone was listening to it,
   * it will refresh immediately.
   */ invalidate() {
        this._store.setUnavailable();
        this._pendingPromise = void 0;
        if (this._subscriptionsCount > 0) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this.refresh());
        }
    }
    isDirty() {
        return this._pendingPromise === void 0;
    }
    onStateChange(callback) {
        const storeObj = this._store.onChange(callback);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this.getOrWait("read-write"));
        if (this._subscriptionsCount++ === 0 && this._options.onSubscribe) {
            const unsubscribe = this._options.onSubscribe(()=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(this.refresh());
            });
            this._unsubscribers.push(unsubscribe);
        }
        let hasUnsubscribed = false;
        return {
            unsubscribe: ()=>{
                if (hasUnsubscribed) return;
                hasUnsubscribed = true;
                storeObj.unsubscribe();
                if (--this._subscriptionsCount === 0) {
                    const currentRefreshPromiseIndex = ++this._mostRecentRefreshPromiseIndex;
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runAsynchronously"])(async ()=>{
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["wait"])(5e3);
                        if (this._subscriptionsCount === 0 && currentRefreshPromiseIndex === this._mostRecentRefreshPromiseIndex) {
                            this.invalidate();
                        }
                    });
                    for (const unsubscribe of this._unsubscribers){
                        unsubscribe();
                    }
                }
            }
        };
    }
};
;
 //# sourceMappingURL=caches.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/env.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/env.tsx
__turbopack_context__.s([
    "getEnvVariable",
    ()=>getEnvVariable,
    "getNextRuntime",
    ()=>getNextRuntime,
    "getNodeEnvironment",
    ()=>getNodeEnvironment,
    "isBrowserLike",
    ()=>isBrowserLike
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/errors.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
function isBrowserLike() {
    return typeof window !== "undefined" && typeof document !== "undefined" && typeof document.createElement !== "undefined";
}
var ENV_VAR_RENAME = {
    NEXT_PUBLIC_STACK_API_URL: [
        "STACK_BASE_URL",
        "NEXT_PUBLIC_STACK_URL"
    ]
};
function getEnvVariable(name, defaultValue) {
    if (isBrowserLike()) {
        throw new Error(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Can't use getEnvVariable on the client because Next.js transpiles expressions of the kind process.env.XYZ at build-time on the client.
    
      Use process.env.XYZ directly instead.
    `);
    }
    if (name === "NEXT_RUNTIME") {
        throw new Error(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Can't use getEnvVariable to access the NEXT_RUNTIME environment variable because it's compiled into the client bundle.
    
      Use getNextRuntime() instead.
    `);
    }
    for (const [newName, oldNames] of Object.entries(ENV_VAR_RENAME)){
        if (oldNames.includes(name)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(`Environment variable ${name} has been renamed to ${newName}. Please update your configuration to use the new name.`);
        }
    }
    let value = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env[name];
    if (!value && ENV_VAR_RENAME[name]) {
        for (const oldName of ENV_VAR_RENAME[name]){
            value = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env[oldName];
            if (value) break;
        }
    }
    if (value === void 0) {
        if (defaultValue !== void 0) {
            value = defaultValue;
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])(`Missing environment variable: ${name}`);
        }
    }
    return value;
}
function getNextRuntime() {
    return ("TURBOPACK compile-time value", "") || (0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$errors$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["throwErr"])("Missing environment variable: NEXT_RUNTIME");
}
function getNodeEnvironment() {
    return getEnvVariable("NODE_ENV", "");
}
;
 //# sourceMappingURL=env.js.map
}),
"[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/react.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/utils/react.tsx
__turbopack_context__.s([
    "NoSuspenseBoundaryError",
    ()=>NoSuspenseBoundaryError,
    "componentWrapper",
    ()=>componentWrapper,
    "forwardRefIfNeeded",
    ()=>forwardRefIfNeeded,
    "getNodeText",
    ()=>getNodeText,
    "mapRef",
    ()=>mapRef,
    "mapRefState",
    ()=>mapRefState,
    "shouldRethrowRenderingError",
    ()=>shouldRethrowRenderingError,
    "suspend",
    ()=>suspend,
    "suspendIfSsr",
    ()=>suspendIfSsr,
    "useRefState",
    ()=>useRefState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/env.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/promises.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/drin-platform/node_modules/@stackframe/stack-shared/dist/esm/utils/strings.js [app-client] (ecmascript)");
;
;
;
;
function componentWrapper(displayName, render) {
    const Component = forwardRefIfNeeded(render);
    Component.displayName = displayName;
    return Component;
}
function forwardRefIfNeeded(render) {
    const version = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].version;
    const major = parseInt(version.split(".")[0]);
    if (major < 19) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].forwardRef(render);
    } else {
        return (props)=>render(props, props.ref);
    }
}
function getNodeText(node) {
    if ([
        "number",
        "string"
    ].includes(typeof node)) {
        return `${node}`;
    }
    if (!node) {
        return "";
    }
    if (Array.isArray(node)) {
        return node.map(getNodeText).join("");
    }
    if (typeof node === "object" && "props" in node) {
        return getNodeText(node.props.children);
    }
    throw new Error(`Unknown node type: ${typeof node}`);
}
function suspend() {
    __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].use((0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$promises$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["neverResolve"])());
    throw new Error("Somehow a Promise that never resolves was resolved?");
}
function mapRef(ref, mapper) {
    let last = null;
    return {
        get current () {
            const input = ref.current;
            if (last === null || input !== last[0]) {
                last = [
                    input,
                    mapper(input)
                ];
            }
            return last[1];
        }
    };
}
function useRefState(initialValue) {
    const [, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(initialValue);
    const ref = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useRef(initialValue);
    const setValue = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useCallback({
        "useRefState.useCallback[setValue]": (updater)=>{
            const value = typeof updater === "function" ? updater(ref.current) : updater;
            ref.current = value;
            setState(value);
        }
    }["useRefState.useCallback[setValue]"], []);
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useMemo({
        "useRefState.useMemo[res]": ()=>({
                get current () {
                    return ref.current;
                },
                set: setValue
            })
    }["useRefState.useMemo[res]"], [
        setValue
    ]);
    return res;
}
function mapRefState(refState, mapper, reverseMapper) {
    let last = null;
    return {
        get current () {
            const input = refState.current;
            if (last === null || input !== last[0]) {
                last = [
                    input,
                    mapper(input)
                ];
            }
            return last[1];
        },
        set (updater) {
            const value = typeof updater === "function" ? updater(this.current) : updater;
            refState.set(reverseMapper(refState.current, value));
        }
    };
}
function shouldRethrowRenderingError(error) {
    return !!error && typeof error === "object" && "digest" in error && error.digest === "BAILOUT_TO_CLIENT_SIDE_RENDERING";
}
var NoSuspenseBoundaryError = class extends Error {
    constructor(options){
        super(__TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$strings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deindent"]`
      Suspense boundary not found! Read the error message below carefully on how to fix it.

      ${options.caller ?? "This code path"} attempted to display a loading indicator, but didn't find a Suspense boundary above it. Please read the error message below carefully.
      
      The fix depends on which of the 4 scenarios caused it:
      
      1. [Next.js] You are missing a loading.tsx file in your app directory. Fix it by adding a loading.tsx file in your app directory.

      2. [React] You are missing a <Suspense> boundary in your component. Fix it by wrapping your component (or the entire app) in a <Suspense> component.

      3. [Next.js] The component is rendered in the root (outermost) layout.tsx or template.tsx file. Next.js does not wrap those files in a Suspense boundary, even if there is a loading.tsx file in the same folder. To fix it, wrap your layout inside a route group like this:

        - app
        - - layout.tsx  // contains <html> and <body>, alongside providers and other components that don't need ${options.caller ?? "this code path"}
        - - loading.tsx  // required for suspense
        - - (main)
        - - - layout.tsx  // contains the main layout of your app, like a sidebar or a header, and can use ${options.caller ?? "this code path"}
        - - - route.tsx  // your actual main page
        - - - the rest of your app

        For more information on this approach, see Next's documentation on route groups: https://nextjs.org/docs/app/building-your-application/routing/route-groups
      
      4. You caught this error with try-catch or a custom error boundary. Fix this by rethrowing the error or not catching it in the first place.

      See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout

      More information on SSR and Suspense boundaries: https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content
    `);
        this.name = "NoSuspenseBoundaryError";
        this.reason = options.caller ?? "suspendIfSsr()";
        this.digest = "BAILOUT_TO_CLIENT_SIDE_RENDERING";
    }
};
function suspendIfSsr(caller) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$drin$2d$platform$2f$node_modules$2f40$stackframe$2f$stack$2d$shared$2f$dist$2f$esm$2f$utils$2f$env$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserLike"])()) {
        throw new NoSuspenseBoundaryError({
            caller
        });
    }
}
;
 //# sourceMappingURL=react.js.map
}),
]);

//# sourceMappingURL=797a3_%40stackframe_stack-shared_dist_esm_19d90062._.js.map