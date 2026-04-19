import localtunnel from 'localtunnel';

async function startTunnel(port, name) {
  try {
    const tunnel = await localtunnel({ port });
    console.log(`${name} TUNNEL URL: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log(`${name} tunnel closed, restarting...`);
      setTimeout(() => startTunnel(port, name), 1000);
    });

    tunnel.on('error', (err) => {
      console.log(`${name} tunnel error:`, err);
    });
  } catch (err) {
    console.log(`${name} tunnel failed to start, retrying...`);
    setTimeout(() => startTunnel(port, name), 1000);
  }
}

startTunnel(5000, 'BACKEND');
startTunnel(5173, 'FRONTEND');
