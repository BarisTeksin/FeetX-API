import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
	if (req.user.role !== Role.ADMIN) return res.status(403).json({ error: 'Forbidden' });
	return next();
}
