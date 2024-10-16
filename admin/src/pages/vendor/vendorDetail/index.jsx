import {
	useApproveVendorMutation,
	useGetVendorDetailsQuery,
} from "@redux/vendor/vendorApi";
import {
	Button,
	Divider,
	Flex,
	message,
	Popconfirm,
	Space,
	Typography,
} from "antd";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const VendorDetail = () => {
	const navigate = useNavigate();
	const { vendorId } = useParams();

	const { data: vendor } = useGetVendorDetailsQuery(vendorId, {
		skip: !vendorId,
	});

	const [approveVendor, { isLoading }] = useApproveVendorMutation();

	const handleApproveVendor = async () => {
		await approveVendor({ id: vendorId, data: { is_approved: true } }).unwrap();
		message.success("Vendor approved successfully");
	};

	const handleDisableVendor = async () => {
		approveVendor({
			id: vendorId,
			data: { is_approved: false },
		});
		message.success("Vendor rejected successfully");
	};

	return (
		<>
			<Flex justify="space-between" align="center">
				<Space align="center">
					<Button
						shape="circle"
						onClick={() => navigate(-1)}
						icon={<IoMdArrowRoundBack />}
					/>
					<Typography.Title level={2} className="mb-0">
						Vendor Detail
					</Typography.Title>
				</Space>

				{!vendor?.is_approved ? (
					<Popconfirm
						title="Approve the vendor"
						description="Are you sure to approve this vendor?"
						onConfirm={handleApproveVendor}
						okText="Approve"
						cancelText="Cancel"
						placement="topRight"
					>
						<Button type="primary" disabled={isLoading} loading={isLoading}>
							Approve
						</Button>
					</Popconfirm>
				) : (
					<Popconfirm
						title="Disable the vendor"
						description="Are you sure to disable this vendor?"
						onConfirm={handleDisableVendor}
						okText="Disable"
						cancelText="Cancel"
						placement="topRight"
					>
						<Button disabled={isLoading} loading={isLoading} danger>
							Disable
						</Button>
					</Popconfirm>
				)}
			</Flex>
			<Divider />

			<Space direction="vertical">
				<Typography.Text>Vendor Name: {vendor?.store_name}</Typography.Text>
				<Typography.Text>Vendor Email: {vendor?.email}</Typography.Text>
				<Typography.Text>Vendor Phone: {vendor?.phone}</Typography.Text>
				<Typography.Text>Vendor Address: {vendor?.address}</Typography.Text>
			</Space>
		</>
	);
};

export default VendorDetail;
