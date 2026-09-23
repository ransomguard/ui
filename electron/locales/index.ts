import type { MenuTranslations } from "./types";
import { en } from "./en";
import { ko } from "./ko";



export type { MenuTranslations };

export const locales: Record<string, MenuTranslations> = {
	en: en,
	"en-US": en,
	ko: ko,
	"ko-KR": ko,
};
