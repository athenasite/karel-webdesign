/**
 * @file mapper.js
 * @description Standard factory mapper to translate Sheet headers to technical keys.
 */

export function createMapper(schema) {
    const headerMap = {};
    const valueMap = {};

    if (schema && schema.mapping) {
        Object.keys(schema.mapping).forEach(key => {
            const lowerKey = key.toLowerCase();
            const value = schema.mapping[key];
            headerMap[lowerKey] = value;
            valueMap[lowerKey] = value;
        });
    }

    return {
        mapHeader: (header) => {
            if (!header) return "";
            const clean = header.trim().toLowerCase();
            return headerMap[clean] || header.trim();
        },
        mapValue: (value) => {
            if (typeof value !== 'string') return value;
            const clean = value.trim().toLowerCase();
            return valueMap[clean] || value.trim();
        }
    };
}
