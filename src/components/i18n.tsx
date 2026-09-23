import { useRender, mergeProps } from "@base-ui/react";
import { useTranslation } from "react-i18next";

import type { FlattenedKeys } from "@/locales";



export interface I18nProps<Prefix extends string | undefined = undefined> extends useRender.ComponentProps<"span"> {
	prefix?: Prefix;
	i18nKey?: FlattenedKeys<Prefix>;
}

export function I18n<Prefix extends string | undefined = undefined>({
	prefix: _prefix,
	i18nKey,
	render,
	...props
}: I18nProps<Prefix>) {
	const { t } = useTranslation();

	const prefix = _prefix ? `${_prefix}.` : "";

	const defaultProps: useRender.ElementProps<"span"> = {
		children: i18nKey && t(prefix + i18nKey as unknown as Parameters<typeof t>[0]),
	};

	const element = useRender({
		defaultTagName: "span",
		render,
		props: mergeProps<"span">(defaultProps, props),
	});

	return element;
}
