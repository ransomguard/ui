import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";



export default defineConfig([
	globalIgnores([
		"dist",
	]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			globals: globals.browser,
		},
		plugins: {
			"@stylistic": stylistic,
		},
		rules: {
			// eslint
			"no-empty":  [
				"error",
				{
					allowEmptyCatch: true,
				},
			],

			// TypeScript
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{
					allowInterfaces: "always",
				},
			],

			// Stylistic
			"@stylistic/semi": [
				"error",
				"always",
			],
			"@stylistic/jsx-tag-spacing": [
				"error",
				{
					closingSlash: "never",
					beforeSelfClosing: "never",
					afterOpening: "never",
					beforeClosing: "never",
				},
			],
		},
	},
]);
