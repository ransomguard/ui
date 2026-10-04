export const isArray: (value: unknown) => value is unknown[] = Array.isArray;

export const isObject = (value: unknown): value is Record<string, unknown> => (
	value !== null && typeof value === "object"
);

export const isNullish = (value: unknown): value is null | undefined => (
	typeof value === "undefined" || value === null
);

export const isString = (value: unknown): value is string => (
	typeof value === "string"
);

export const isNumber = (value: unknown): value is number => (
	typeof value === "number"
);

export const isBoolean = (value: unknown): value is boolean => (
	typeof value === "boolean"
);



export const isStringArray = (value: unknown): value is string[] => (
	isArray(value) && value.every(isString)
);

export const isNumberArray = (value: unknown): value is number[] => (
	isArray(value) && value.every(isNumber)
);

export const isBooleanArray = (value: unknown): value is boolean[] => (
	isArray(value) && value.every(isBoolean)
);



export const maybeArray = (value: unknown) => (
	isNullish(value) || isArray(value)
);

export const maybeObject = (value: unknown) => (
	isNullish(value) || isObject(value)
);

export const maybeString = (value: unknown) => (
	isNullish(value) || isString(value)
);

export const maybeNumber = (value: unknown) => (
	isNullish(value) || isNumber(value)
);

export const maybeBoolean = (value: unknown) => (
	isNullish(value) || isBoolean(value)
);



export const maybeStringArray = (value: unknown) => (
	isNullish(value) || isStringArray(value)
);

export const maybeNumberArray = (value: unknown) => (
	isNullish(value) || isNumberArray(value)
);

export const maybeBooleanArray = (value: unknown) => (
	isNullish(value) || isBooleanArray(value)
);
