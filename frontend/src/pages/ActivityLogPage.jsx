import axios from 'axios';
import React, { useEffect, useState } from 'react';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/activity-logs')
      .then(res => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading activity logs...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Activity Log</h2>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Action</th>
            <th>Entity</th>
            <th>Entity ID</th>
            <th>User</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{log.action}</td>
              <td>{log.entity}</td>
              <td>{log.entityId}</td>
              <td>{log.user}</td>
              <td><pre style={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.details, null, 2)}</pre></td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogPage;
