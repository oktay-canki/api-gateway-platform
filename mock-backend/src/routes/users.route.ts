import { Router, Request, Response } from 'express';

let users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com' },
];

const userRouter = Router();

userRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json(users);
});

userRouter.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(user);
});

userRouter.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
  };

  users.push(newUser);
  return res.status(201).json(newUser);
});

export default userRouter;
