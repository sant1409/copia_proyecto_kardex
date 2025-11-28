import net from 'net';

const host = 'smtp-relay.brevo.com';
const port = 587;

const socket = new net.Socket();

socket.setTimeout(5000); // 5 segundos

socket.connect(port, host, () => {
  console.log(`✅ Conectado a ${host}:${port}`);
  socket.destroy();
});

socket.on('timeout', () => {
  console.log(`⏱ Timeout al conectar con ${host}:${port}`);
  socket.destroy();
});

socket.on('error', (err) => {
  console.log(`❌ Error al conectar con ${host}:${port}:`, err.message);
  socket.destroy();
});
