import { Router, Request, Response } from 'express';

let products = [
  { id: 1, name: 'Mechanical Keyboard', price: 89.99 },
  { id: 2, name: 'Wireless Mouse', price: 29.99 },
];

const productRouter = Router();

productRouter.get('/', (req: Request, res: Response) => {
  return res.status(200).json(products);
});

productRouter.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(product);
});

export default productRouter;
