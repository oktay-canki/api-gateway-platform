import express from 'express';
import healthRouter from './routes/health';
import userRouter from './routes/users.route';
import productRouter from './routes/products.route';
import testRouter from './routes/test.route';

const app = express();
const PORT = 4001;

app.use(express.json());
app.use('/health', healthRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/test', testRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
