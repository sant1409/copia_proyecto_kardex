'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stock_inventario', {
      id_stock_inventario: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre_producto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      id_kardex: {          
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'kardex', key: 'id_kardex' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_insumo: {          
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'insumos', key: 'id_insumo' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_casa_comercial: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'casa_comercial', key: 'id_casa_comercial' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_laboratorio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'laboratorio', key: 'id_laboratorio' }, 
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cantidad_actual: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
            id_sede: {
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sede',
          key: 'id_sede'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stock_inventario');
  }
};
