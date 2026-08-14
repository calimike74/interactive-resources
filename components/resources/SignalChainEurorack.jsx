'use client';

export default function SignalChainEurorack() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 4rem)', minHeight: '600px' }}>
      <iframe
        src="/signal-chain"
        title="Signal Chain Rack"
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
