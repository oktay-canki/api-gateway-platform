import { Router, Request, Response } from 'express';

const testRouter = Router();

let failOnceCount = 0;

testRouter.get('/timeout', async (req: Request, res: Response) => {
  const ms = Number(req.query.ms ?? 1000);

  await new Promise((resolve) => setTimeout(resolve, ms));

  return res.status(200).json({
    success: true,
    delayedMs: ms,
  });
});

testRouter.get('/fail', (_req: Request, res: Response) => {
  return res.status(500).json({
    error: 'Mock upstream failure',
  });
});

testRouter.get('/fail-once', (_req: Request, res: Response) => {
  failOnceCount += 1;

  if (failOnceCount === 1) {
    res.socket?.destroy();
    return;
  }

  return res.status(200).json({
    success: true,
    attempt: failOnceCount,
  });
});

testRouter.get('/echo', (req: Request, res: Response) => {
  return res.status(200).json({
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
  });
});

testRouter.post('/reset', (_req: Request, res: Response) => {
  failOnceCount = 0;

  return res.status(204).send();
});

export default testRouter;
