import sequelize from '../config/database.js';
import Vecino from '../models/Vecino.js';
import Cuota from '../models/Cuota.js';

export const eliminarVecinoConTransaccion = async (vecinoId) => {

    return await sequelize.transaction(async (t) => {

        const vecino = await Vecino.findByPk(vecinoId, { transaction: t });
        if (!vecino) {
            return false; // No se encontró
        }

        await Cuota.destroy({
            where: { vecino_id: vecinoId },
            transaction: t
        });

        await Vecino.destroy({
            where: { id: vecinoId },
            transaction: t
        });

        return true;
    });
};