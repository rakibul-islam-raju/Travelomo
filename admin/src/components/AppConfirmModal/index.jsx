import { Modal, Typography } from "antd";

const AppConfirmModal = ({
	title,
	description,
	open,
	onCancel,
	onOk,
	deleteConfirm,
	okText = "Confirm",
}) => {
	return (
		<Modal
			open={open}
			onCancel={onCancel}
			onOk={onOk}
			title={title}
			okText={okText}
			okType={deleteConfirm ? "danger" : "primary"}
		>
			<Typography.Text>
				{deleteConfirm && !description
					? "Are you sure you want to delete this item?"
					: description
					? description
					: "Are you sure?"}
			</Typography.Text>
		</Modal>
	);
};

export default AppConfirmModal;
