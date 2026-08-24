import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Vecino from '../models/Vecino.js';

// POST /auth/login - Autenticar y emitir un JWT
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Debes enviar "email" y "password".' });
        }

        // 1. Buscar al vecino por su email
        const vecino = await Vecino.findOne({ where: { email } });
        if (!vecino) {
            // Nunca revelamos si fue el email o el password los que fallaron
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña enviada contra el hash guardado
        const passwordValida = await bcrypt.compare(password, vecino.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. Definir el "payload": los datos que viajarán DENTRO del token.
        //    Regla de oro: nunca metas aquí la contraseña ni el hash.
        const payload = {
            id: vecino.id,
            email: vecino.email,
            rol: vecino.rol
        };

        // 4. Firmar el token con la clave secreta del servidor
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno al procesar el inicio de sesión.' });
    }
};

// GET /auth/perfil - Ruta de DEMOSTRACIÓN protegida por JWT
export const perfil = (req, res) => {
    // req.usuario fue inyectado por el middleware "verificarToken"
    // ANTES de que esta función se ejecutara.
    res.status(200).json({
        message: 'Accediste a una ruta protegida. Tu token es válido.',
        usuario: req.usuario
    });
};