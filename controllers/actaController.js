import path from 'path';
import fs from 'fs/promises';
import Acta from '../models/Acta.js';

// 🟢 POST /actas - Subir archivo y crear registro
export const subirActa = async (req, res) => {
    try {
        // 1. Validar que la petición contenga un archivo
        if (!req.files || Object.keys(req.files).length === 0 || !req.files.documento) {
            return res.status(400).json({ error: 'No se subió ningún archivo. La clave debe ser "documento".' });
        }

        const documento = req.files.documento;

        // 2. Validar la extensión del archivo (Seguridad)
        const extensionesPermitidas = ['.pdf', '.docx'];
        const extension = path.extname(documento.name).toLowerCase();

        if (!extensionesPermitidas.includes(extension)) {
            return res.status(400).json({ error: 'Extensión no válida. Solo se permiten .pdf o .docx' });
        }

        // 3. Renombrado dinámico para evitar sobreescritura (ej: acta_1708107621493.pdf)
        const nombreFinal = `acta_${Date.now()}${extension}`;

        // 4. Definir ruta de almacenamiento (path.resolve nos da la ruta absoluta segura)
        const rutaDestino = path.resolve(`uploads/actas/${nombreFinal}`);

        // 5. Mover el archivo físico al disco duro del servidor
        await documento.mv(rutaDestino);

        // 6. Guardar el registro en la base de datos (PostgreSQL)
        const nuevaActa = await Acta.create({
            titulo: req.body.titulo,
            resumen: req.body.resumen,
            fecha_asamblea: req.body.fecha_asamblea,
            subido_por: req.body.subido_por, // ID del directivo que lo sube
            archivo_url: `/archivos/actas/${nombreFinal}` // URL pública para accederlo luego
        });

        res.status(201).json({
            message: 'Acta subida y registrada exitosamente',
            data: nuevaActa
        });

    } catch (error) {
        console.error('Error al procesar el acta:', error);
        res.status(500).json({ error: 'Fallo interno al subir el documento.' });
    }
};

// 🔴 DELETE /actas/:id - Borrar registro y destruir el archivo físico
export const eliminarActa = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar el acta en la BD para saber el nombre del archivo
        const acta = await Acta.findByPk(id);
        if (!acta) {
            return res.status(404).json({ error: 'Acta no encontrada en la base de datos.' });
        }

        // 2. Construir la ruta física extrayendo el nombre del archivo de la URL
        const nombreArchivo = path.basename(acta.archivo_url);
        const rutaFisica = path.resolve(`uploads/actas/${nombreArchivo}`);

        // 3. Eliminar el archivo del disco duro usando fs/promises
        try {
            await fs.access(rutaFisica); // Verifica si existe
            await fs.unlink(rutaFisica); // Lo borra físicamente
        } catch (fileError) {
            console.warn(`El archivo físico ${nombreArchivo} no existía en el disco, se procederá a borrar el registro en BD de todos modos.`);
        }

        // 4. Eliminar el registro de PostgreSQL
        await Acta.destroy({ where: { id } });

        res.status(204).send(); // Todo OK, sin contenido que devolver

    } catch (error) {
        console.error('Error al eliminar el acta:', error);
        res.status(500).json({ error: 'Error al ejecutar la eliminación del documento.' });
    }
};