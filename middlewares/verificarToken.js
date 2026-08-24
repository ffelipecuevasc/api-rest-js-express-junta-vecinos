import jwt from "jsonwebtoken";

// Middleware para interceptar la request para autenticar el usuario
export const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({ error: "Acceso denegado. No se detectó un token de autenticación." });
    }

    // { bearer : 0390asdfafasñkhgaweoi'310313.asdfioqw390e239r032.asfiasdfasdf }
    const partes = authHeader.split(' ');
    if(partes.length !== 2 || partes[0] !== 'Bearer'){
        return res.status(401).json({ error: "Formato de token inválido. Usa BEARER de JWT." });
    }

    const token = partes[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token inválido o expirado." });
    }
};