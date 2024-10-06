import Loader from "@components/Loader";
import { hideMessage } from "@redux/common/commonSlice";
import { message } from "antd";
import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";

const AppInfoView = () => {
	const dispatch = useDispatch();

	const { isLoading, message: msg } = useSelector((state) => state.common);

	useEffect(() => {
		if (msg.show) {
			message[msg.type](msg.content);
			dispatch(hideMessage());
		}
	}, [msg, dispatch]);

	return <>{isLoading ? <Loader /> : null}</>;
};

export default AppInfoView;
