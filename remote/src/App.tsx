import Greeting from './Greeting';
import './App.css';

function App() {
  return (
    <main className="container">
      <h1>Remote Micro-Frontend</h1>
      <p>This project exposes a reusable greeting component for the host application.</p>
      <Greeting />
      <div className="hint">
        <p>To consume this from the host, run both apps:</p>
        <ol>
          <li>Start the remote: <code>npm install</code> then <code>npm run dev</code> in <code>remote/</code>.</li>
          <li>Start the host: <code>npm install</code> then <code>npm run dev</code> in <code>host/</code>.</li>
        </ol>
      </div>
    </main>
  );
}

export default App;
