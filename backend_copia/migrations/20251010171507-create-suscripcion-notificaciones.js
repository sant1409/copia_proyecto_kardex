'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('suscripcion_notificaciones', {
      id_suscripcion_notificaciones: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      correo: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      id_sede: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índice único para que no se repita correo + id_sede
    await queryInterface.addConstraint('suscripcion_notificaciones', {
      fields: ['correo', 'id_sede'],
      type: 'unique',
      name: 'correo_sede_unique'
    });

    // Índice para buscar rápido por id_sede
    await queryInterface.addIndex('suscripcion_notificaciones', ['id_sede'], {
      name: 'idx_sede'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('suscripcion_notificaciones');
  }
};
