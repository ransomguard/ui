import type { Resource, ParseKeys } from "i18next";

import type { AppTranslations } from "./types";
import { en } from "./en";
import { ko } from "./ko";



export type { AppTranslations };

export type FlattenedKeys<Prefix extends string | undefined = undefined> = ParseKeys<typeof defaultNS, {}, Prefix>;

export const defaultNS = "translation";

export const enableSelector = true;

export const resources: Resource = {
	en: { translation: en },
	ko: { translation: ko },
};
