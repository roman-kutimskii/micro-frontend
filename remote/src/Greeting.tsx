import './Greeting.css';

type GreetingProps = {
  hostName?: string;
};

export default function Greeting({ hostName = 'remote shell' }: GreetingProps) {
  return (
    <div className="greeting">
      <p className="eyebrow">Shared component</p>
      <h2>Welcome from the remote</h2>
      <p>
        This UI is rendered from the <strong>remote</strong> micro-frontend and hydrated inside <strong>{hostName}</strong>.
      </p>
    </div>
  );
}
