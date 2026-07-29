import { Router } from 'express';
import { obtenerCuotas } from '../controllers/cuotaController.js';

const router = Router();

// Endpoints RESTful para el recurso "cuotas"
router.get('/', obtenerCuotas);

export default router;