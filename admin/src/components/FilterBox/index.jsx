import { ReloadOutlined } from "@ant-design/icons";
import { Button, Form, Space } from "antd";
import styles from "./index.module.scss";

const FilterBox = ({ children, refresh }) => {
	return (
		<div className={styles.filterContainer}>
			<Form layout="vertical">
				<Space wrap direction="horizontal">
					{children}
				</Space>
			</Form>
			{refresh && (
				<Button title="Refresh" onClick={refresh} icon={<ReloadOutlined />} />
			)}
		</div>
	);
};

export default FilterBox;
