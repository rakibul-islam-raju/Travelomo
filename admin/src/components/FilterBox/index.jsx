import { ReloadOutlined } from "@ant-design/icons";
import { Button, Flex, Space } from "antd";

const FilterBox = ({ children, refresh }) => {
	return (
		<Flex
			justify="space-between"
			align="center"
			wrap
			gap={10}
			style={{ marginBottom: 20 }}
		>
			<Space wrap>{children}</Space>
			{refresh && (
				<Button title="Refresh" onClick={refresh} icon={<ReloadOutlined />} />
			)}
		</Flex>
	);
};

export default FilterBox;
