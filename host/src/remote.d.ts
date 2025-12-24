declare module 'remote/Greeting' {
  import { ComponentType } from 'react';
  const Component: ComponentType<{ hostName?: string }>;
  export default Component;
}
