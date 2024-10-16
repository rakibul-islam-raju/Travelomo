import { Input } from "antd";
import { MdOutlineSearch } from "react-icons/md";

const SearchInput = () => {
	return (
		<Input size="large" placeholder="Search..." prefix={<MdOutlineSearch />} />
	);
};

export default SearchInput;
