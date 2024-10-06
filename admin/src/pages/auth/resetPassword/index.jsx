import { Button, Card, Flex, Input } from "antd";
import { Form, Link } from "react-router-dom";

const ResetPassword = () => {
	const handleSubmit = (values) => {
		console.log(values);
	};

	return (
		<Card>
			<Form layout="vertical" onFinish={handleSubmit}>
				<Form.Item
					label="New Password"
					name="password"
					className="form-field"
					rules={[
						{ required: true, message: "Please input your New Password!" },
					]}
				>
					<Input type="password" placeholder="New Password" />
				</Form.Item>

				<Form.Item
					label="Retype Password"
					name="confirmPassword"
					className="form-field"
					rules={[
						{
							required: true,
							message: "Please confirm your New Password!",
						},
					]}
				>
					<Input type="password" placeholder="Confirm Password" />
				</Form.Item>

				<Button block type="primary" htmlType="submit">
					Forget Password
				</Button>
			</Form>

			<Flex justify="center">
				<Link to="/login">Back to Login</Link>
			</Flex>
		</Card>
	);
};

export default ResetPassword;
