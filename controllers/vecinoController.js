import Vecino from '../models/Vecino.js';
import Cuota from '../models/Cuota.js';
import bcrypt from 'bcryptjs';

import { eliminarVecinoConTransaccion } from '../services/vecinoService.js';

export const crearVecino = async (req, res) => {
    try {
        const { password, ...restoDatos } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'El campo "password" es obligatorio.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const nuevoVecino = await Vecino.create({ ...restoDatos, password_hash });

        const { password_hash: _omit, ...vecinoData } = nuevoVecino.toJSON();

        res.status(201).json({
            message: 'Vecino registrado exitosamente',
            data: vecinoData
        });
    } catch (error) {
        console.error('Error al crear vecino:', error);
        res.status(400).json({ error: 'Fallo al crear el vecino. Verifica los datos enviados.' });
    }
};

export const obtenerVecinos = async (req, res) => {
    try {
        // Obtenemos posibles filtros desde la URL, ej: /vecinos?rol=directiva
        const { rol } = req.query;

        // Construimos el objeto "where" dinámicamente
        const queryOptions = {
            attributes: { exclude: ['password_hash'] }, // Nunca devolver passwords
            include: [{ model: Cuota, attributes: ['id', 'monto', 'estado_pago'] }] // Hacemos un JOIN simple para ver sus cuotas
        };

        if (rol) {
            queryOptions.where = { rol };
        }

        const vecinos = await Vecino.findAll(queryOptions);
        res.status(200).json({ data: vecinos });
    } catch (error) {
        console.error('Error al obtener vecinos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const obtenerVecinoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const vecino = await Vecino.findByPk(id, {
            attributes: { exclude: ['password_hash'] }
        });

        if (!vecino) {
            return res.status(404).json({ error: 'Vecino no encontrado' });
        }

        res.status(200).json({ data: vecino });
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el vecino' });
    }
};

export const actualizarVecino = async (req, res) => {
    try {
        const { id } = req.params;

        // update devuelve un array: [numero_de_filas_afectadas]
        const [filasActualizadas] = await Vecino.update(req.body, {
            where: { id }
        });

        if (filasActualizadas === 0) {
            return res.status(404).json({ error: 'Vecino no encontrado o sin cambios detectados' });
        }

        res.status(200).json({ message: 'Datos del vecino actualizados correctamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar datos' });
    }
};

export const eliminarVecino = async (req, res) => {
    try {
        const { id } = req.params;

        // Delegamos la complejidad al Servicio que maneja la transacción
        const eliminado = await eliminarVecinoConTransaccion(id);

        if (!eliminado) {
            return res.status(404).json({ error: 'Vecino no encontrado' });
        }

        // 204 No Content: Éxito total, sin contenido para devolver
        res.status(204).send();
    } catch (error) {
        console.error('Error crítico al eliminar:', error);
        res.status(500).json({ error: 'Error al ejecutar la eliminación en cascada' });
    }
};