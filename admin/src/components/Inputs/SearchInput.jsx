import { Input } from "antd";
import { MdOutlineSearch } from "react-icons/md";

const SearchInput = () => {
	return (
		<Input
			style={{ width: 300 }}
			placeholder="Search..."
			prefix={<MdOutlineSearch />}
		/>
	);
};

export default SearchInput;
