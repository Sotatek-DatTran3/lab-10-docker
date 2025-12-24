import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [backends, setBackends] = useState({});
  const [loading, setLoading] = useState(true);

  const testBackends = async () => {
    setLoading(true);
    console.log('Testing backend connections...');

    const backendUrls = {
      'Node.js': '/api/nodejs/health',
      'PHP': '/api/php/health',
      'Java': '/api/java/health',
      'Python': '/api/python/health',
      '.NET': '/api/dotnet/health',
      'NestJS': '/api/nestjs/health'
    };

    const results = {};

    for (const [name, url] of Object.entries(backendUrls)) {
      try {
        console.log(`Testing ${name} at ${url}`);
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log(`${name} response:`, response.data);

        // Process database information
        let databaseInfo = 'N/A';
        if (response.data?.database && typeof response.data.database === 'object') {
          const dbEntries = Object.entries(response.data.database);
          const dbConnections = dbEntries
            .filter(([key, value]) => key !== 'version' && typeof value === 'string' && value.includes('Connected'))
            .map(([key, value]) => {
              // Normalize database names
              const dbName = key.replace('postgresql', 'postgres').replace('mysql', 'mysql');
              return dbName;
            });
          databaseInfo = dbConnections.length > 0 ? dbConnections.join(', ') : 'Connected';
        }

        results[name] = {
          status: 'Connected',
          service: response.data?.service || name,
          version: response.data?.version || '1.0.0',
          timestamp: response.data?.timestamp || new Date().toISOString(),
          database: databaseInfo,
          uptime: response.data?.uptime || null
        };
      } catch (error) {
        console.error(`${name} error:`, error.message);
        results[name] = {
          status: 'Disconnected',
          service: name,
          error: error.message
        };
      }
    }

    console.log('Final results:', results);
    setBackends(results);
    setLoading(false);
  };

  useEffect(() => {
    testBackends();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>🏗️ 3-Tier Architecture Demo</h1>
          <div>Testing backend connections...</div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏗️ 3-Tier Architecture Demo</h1>
        <p>Testing connections to multiple backend services</p>

        <div className="backend-grid">
          {Object.entries(backends).map(([name, result]) => (
            <div key={name} className={`backend-card ${result.status.toLowerCase()}`}>
              <h3>{name}</h3>
              <div className={`status ${result.status.toLowerCase()}`}>
                {result.status}
              </div>
              {result.status === 'Connected' ? (
                <div className="backend-info">
                  <p>✅ Service: {result.service}</p>
                  <p>📦 Version: {result.version}</p>
                  <p>🗄️ Database: {result.database}</p>
                  {result.uptime && (
                    <p>⏱️ Uptime: {typeof result.uptime === 'number' ? `${Math.floor(result.uptime)}s` : result.uptime}</p>
                  )}
                  <p>⏰ Last Check: {new Date(result.timestamp).toLocaleTimeString()}</p>
                </div>
              ) : (
                <div className="error">
                  ❌ Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={testBackends} className="refresh-btn">
          🔄 Refresh Connections
        </button>
      </header>
    </div>
  );
}

export default App;