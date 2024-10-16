import { Space } from "antd";

const FilterBox = ({ children }) => {
	return (
		<Space wrap style={{ marginBottom: 20 }}>
			{children}
		</Space>
	);
};

export default FilterBox;
