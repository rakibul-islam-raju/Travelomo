/* eslint-disable no-undef */
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@components": path.resolve(__dirname, "./src/components"),
			"@utils": path.resolve(__dirname, "./src/utils"),
			"@assets": path.resolve(__dirname, "./src/assets"),
			"@app": path.resolve(__dirname, "./src/app"),
			"@config": path.resolve(__dirname, "./src/config"),
			"@helpers": path.resolve(__dirname, "./src/helpers"),
			"@hooks": path.resolve(__dirname, "./src/hooks"),
			"@pages": path.resolve(__dirname, "./src/pages"),
			"@redux": path.resolve(__dirname, "./src/redux"),
			"@services": path.resolve(__dirname, "./src/services"),
			"@shared": path.resolve(__dirname, "./src/shared"),
			"@layouts": path.resolve(__dirname, "./src/layouts"),
			"@data": path.resolve(__dirname, "./src/data"),
			"@router": path.resolve(__dirname, "./src/routes"),
		},
	},
});
