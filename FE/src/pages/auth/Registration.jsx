// src/components/Register.js
import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import Lottie from 'react-lottie';
import animationData from '../../assets/lottie/register.json'; // replace with your Lottie file
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const { Title, Text } = Typography;

const Register = () => {

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      // Send POST request to Flask API
      const response = await axios.post('http://localhost:5000/register', values);

      // Assuming your Flask API returns a success message
      message.success('Registration successful');
      // Redirect to login page or any other page
      navigate('/CodeNexa') // example redirect
    } catch (error) {
      message.error('Registration failed: ' + (error.response?.data?.msg || 'Unknown error'));
    } finally {
      setLoading(false)
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      {/* Left Side: Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 300,
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header */}
          <Title level={2} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Register
          </Title>

          <Form
            name="register"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Please input your email!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('The two passwords that you entered do not match!')
                    );
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block disabled={loading}>
                {loading ? 'Loading...' : 'Register'}
              </Button>
            </Form.Item>

            <Form.Item>
              <Text type="secondary">
                If you already have an account?{' '}
                <Button type="link" href="/login" style={{ paddingLeft: 0 }}>
                  Login
                </Button>
              </Text>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* Right Side: Lottie Animation */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Lottie options={defaultOptions} height={400} width={400} />
      </div>
    </div>
  );
};

export default Register;
