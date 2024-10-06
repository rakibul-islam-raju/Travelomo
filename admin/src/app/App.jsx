import AppInfoView from "@components/AppInfoView";
import Loader from "@components/Loader";
import useAuthCheck from "@hooks/useAuthCheck";
import { router } from "@router/index";
import { ConfigProvider } from "antd";
import { RouterProvider } from "react-router-dom";
import "./App.css";

function App() {
	const authChecked = useAuthCheck();

	return (
		<ConfigProvider
		// theme={{
		// 	token: {
		// 		colorPrimary: "#164e63",
		// 	},
		// }}
		>
			{!authChecked ? (
				<Loader />
			) : (
				<>
					<RouterProvider router={router} />
					<AppInfoView />
				</>
			)}
		</ConfigProvider>
	);
}

export default App;
