import { Button, Card, Divider, Flex, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";

const ForgetPassword = () => {
	const handleSubmit = (values) => {
		console.log(values);
	};

	return (
		<Card>
			<Typography.Title level={2}>Forget Password</Typography.Title>
			<Divider />
			<Form layout="vertical" onFinish={handleSubmit}>
				<Form.Item
					name="email"
					type="email"
					className="form-field"
					rules={[
						{
							required: true,
							type: "email",
							message: "Please input your Email!",
						},
					]}
				>
					<Input size="large" placeholder={"Your Email"} />
				</Form.Item>

				<Button block type="primary" htmlType="submit">
					Forget Password
				</Button>
			</Form>
			<br />
			<Flex justify="center">
				<Link to="/auth/login">Back to Login</Link>
			</Flex>
		</Card>
	);
};

export default ForgetPassword;
