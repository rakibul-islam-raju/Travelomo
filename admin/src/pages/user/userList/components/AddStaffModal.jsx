import { useCreateStaffMutation } from "@redux/user/userApi";
import { Button, Flex, Form, Input, message, Modal, Select } from "antd";

const AddStaffModal = ({ open, onClose, listArgs }) => {
	const [form] = Form.useForm();

	const [createStaff, { isLoading }] = useCreateStaffMutation();

	const handleSubmit = async (values) => {
		console.log(values);
		await createStaff({ data: values, originalArgs: listArgs }).unwrap();
		message.success("Staff created successfully");
		message.success(
			"An email has been sent to the staff for password creation"
		);
		form.resetFields();
		onClose();
	};

	return (
		<Modal
			open={open}
			onCancel={onClose}
			destroyOnClose
			title="Add New Staff"
			footer={false}
		>
			<Form layout="vertical" form={form} onFinish={handleSubmit}>
				<Form.Item
					required
					rules={[{ required: true }]}
					label="First Name"
					name="first_name"
				>
					<Input />
				</Form.Item>
				<Form.Item
					required
					rules={[{ required: true }]}
					label="Last Name"
					name="last_name"
				>
					<Input />
				</Form.Item>
				<Form.Item
					required
					rules={[{ required: true }]}
					label="Email"
					name="email"
				>
					<Input />
				</Form.Item>
				<Form.Item
					required
					rules={[{ required: true }]}
					label="User Type"
					name="is_superuser"
				>
					<Select
						options={[
							{ value: true, label: "Superuser" },
							{ value: false, label: "Staff" },
						]}
					/>
				</Form.Item>

				<Flex justify="end" gap={10}>
					<Button onClick={onClose}>Cancel</Button>
					<Button type="primary" htmlType="submit" loading={isLoading}>
						Create
					</Button>
				</Flex>
			</Form>
		</Modal>
	);
};

export default AddStaffModal;
