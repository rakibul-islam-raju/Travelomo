import { useLoginMutation } from "@redux/auth/authApi";
import {
	Button,
	Card,
	Divider,
	Flex,
	Form,
	Input,
	message,
	Typography,
} from "antd";
import { Link } from "react-router-dom";

const Login = () => {
	const [login, { isLoading }] = useLoginMutation();

	const handleLogin = async (values) => {
		await login(values).unwrap();
		message.success("Login successful");
	};

	return (
		<Card>
			<Typography.Title level={2} className="text-center">
				Login
			</Typography.Title>
			<Divider />
			<Form layout="vertical" onFinish={handleLogin}>
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
				<Form.Item
					name="password"
					className="form-field"
					rules={[{ required: true, message: "Please input your Password!" }]}
				>
					<Input.Password size="large" placeholder="Your Password" />
				</Form.Item>

				<Button
					block
					type="primary"
					htmlType="submit"
					disabled={isLoading}
					loading={isLoading}
				>
					Login
				</Button>
			</Form>

			<br />

			<Flex justify="center">
				<Link to="/auth/forget-password">Forget Password?</Link>
			</Flex>
		</Card>
	);
};

export default Login;
