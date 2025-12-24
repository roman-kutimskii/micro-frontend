import { Suspense, lazy } from 'react';
import './App.css';

const RemoteGreeting = lazy(() => import('remote/Greeting'));

function App() {
  return (
    <div className="container">
      <h1>Vite + React Micro-Frontend</h1>
      <div className="card">
        <p>
          This host application renders a remote component exposed by the <strong>remote</strong> micro-frontend.
        </p>
        <Suspense fallback={<p>Loading remote greeting...</p>}>
          <RemoteGreeting hostName="Host shell" />
        </Suspense>
      </div>
      <p className="footer">
        Start the remote with <code>npm run dev</code> inside <code>remote/</code> and the host with the same command inside
        <code> host/</code>.
      </p>
    </div>
  );
}

export default App;
