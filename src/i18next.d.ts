import type { AppTranslations, enableSelector, defaultNS } from "@/locales";



declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS;
		enableSelector: typeof enableSelector;
		resources: {
			translation: AppTranslations;
		};
	}
}
