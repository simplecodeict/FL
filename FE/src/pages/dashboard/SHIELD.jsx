import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Button, Progress, Spin, Card, Typography, Space, Layout } from 'antd';
import SideNav from '../navigationBar/SideNav';
import TopNav from '../navigationBar/TopNav';

import AnimationTextSheild from '../animations/AnimationTextShield';

const socket = io('http://localhost:5000');
const { Title } = Typography;
const { Header, Sider, Content } = Layout;


const NotebookRunner = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState([]);
  const [images, setImages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [currentCode, setCurrentCode] = useState(''); // State to hold the currently executing code
  const [executedCode, setExecutedCode] = useState([]); // State to hold previously executed code
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on('progress', (data) => {
      console.log(data);
      setStatus(data.status);
      setProgress((prev) => Math.min(prev + (100 / data.totalCells), 100));
      setCurrentCode(data.code); // Update the currently executing code
    });

    socket.on('output', (data) => {
      // Append executed code to executedCode state
      setExecutedCode((prev) => [...prev, { code: data.cell.source, outputs: data.cell.outputs }]);

      // Clear the currently executing code when the cell execution is completed
      setCurrentCode('');

      // Extract images and logs from output and update state
      const newImages = data.images || [];
      setImages((prevImages) => [...prevImages, ...newImages]);
      const newLogs = data.logs || [];
      setLogs((prevLogs) => [...prevLogs, ...newLogs]);
    });

    socket.on('error', (data) => {
      setStatus(`Error: ${data.error}`);
      setLoading(false);
    });

    return () => {
      socket.off('progress');
      socket.off('output');
      socket.off('error');
    };
  }, []);

  const runNotebook = () => {
    setLoading(true);
    fetch('http://localhost:5000/run-notebook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName: 'component_03.ipynb' }), // Send the file name
    })
      .then(response => response.json())
      .then(data => {
        setLoading(false);
        if (data.status === 'complete') {
          setStatus('Notebook execution complete');
        } else {
          setStatus('Error during notebook execution');
        }
      })
      .catch(error => {
        setLoading(false);
        setStatus(`Error: ${error.message}`);
      });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SideNav />
      <Layout style={{ marginLeft: 200 }}>
        <TopNav />
        <Content style={{ padding: '24px', marginTop: 64, minHeight: 280 }}>
          <AnimationTextSheild />
          <Button type="primary" onClick={runNotebook} disabled={loading}>
            {loading ? 'Running...' : 'Run Notebook'}
          </Button>
          {loading && <Spin style={{ marginBlockStart: '10px' }} />}
          <p>{status}</p>
          <Progress percent={progress} />

          <div>
            {/* Display previously executed code */}
            {executedCode.length > 0 && (
              <div>
                {executedCode.map((cell, index) => (
                  <Card key={index} style={{ marginBottom: '20px', border: '2px solid #52c41a' }}>
                    <Title level={4}>Executed Cell {index + 1}</Title>
                    <pre>{cell.code}</pre>
                    <div>
                      {cell.outputs && cell.outputs.map((output, i) => (
                        <div key={i}>
                          {output.output_type === 'stream' && (
                            <pre>{output.text}</pre>
                          )}
                          {output.output_type === 'display_data' && output.data['image/png'] && (
                            <img
                              src={`data:image/png;base64,${output.data['image/png']}`}
                              alt={`Plot ${i + 1}`}
                              style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                            />
                          )}
                          {output.output_type === 'execute_result' && (
                            <pre>{JSON.stringify(output.data, null, 2)}</pre>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'green' }}>
                      Done
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Display currently executing code */}
            {currentCode && (
              <Card style={{ marginBottom: '20px', border: '2px solid #1890ff' }}>
                <Title level={4}>Currently Executing</Title>
                <pre>{currentCode}</pre>
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <Spin size="small" />
                </div>
              </Card>
            )}

            {/* Display images */}
            {images.length > 0 && (
              <div>
                {images.map((imgSrc, index) => (
                  <Card key={index} title={`Plot ${index + 1}`}>
                    <img src={imgSrc} alt={`Plot ${index + 1}`} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                  </Card>
                ))}
              </div>
            )}

            {/* Display logs */}
            {logs.length > 0 && (
              <div>
                {logs.map((log, index) => (
                  <Space direction="vertical" key={index}>
                    <Title level={4}>Log {index + 1}</Title>
                    <pre>{log}</pre>
                  </Space>
                ))}
              </div>
            )}
          </div>
        </Content>
      </Layout>

    </Layout>
  );
};

export default NotebookRunner;
