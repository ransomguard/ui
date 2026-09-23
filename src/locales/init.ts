import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultNS, enableSelector, resources } from "./";



i18n
	.use(initReactI18next)
	.init({
		defaultNS,
		resources,
		enableSelector,
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
	});
