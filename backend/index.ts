import { createServer } from 'http';

const PORT = 3000;
const server = createServer(async (req, res) => {
  res.end(JSON.stringify({ status: 'ok'}))

});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
