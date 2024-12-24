import { Input } from "antd";
import { MdOutlineSearch } from "react-icons/md";

const SearchInput = ({
	value,
	onChange,
	placeholder = "Search here",
	fullWidth = false,
}) => {
	return (
		<Input
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			style={{
				width: fullWidth ? "100%" : 300,
			}}
			prefix={<MdOutlineSearch />}
		/>
	);
};

export default SearchInput;
