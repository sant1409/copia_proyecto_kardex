  
'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Kardex', {
      id_kardex: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fecha_recepcion: { type: Sequelize.DATE, allowNull: true },
      temperatura_llegada: { type: Sequelize.STRING, allowNull: true },
      maximo: { type: Sequelize.STRING, allowNull: true },
      minimo: { type: Sequelize.STRING, allowNull: true },
      cantidad: { type: Sequelize.INTEGER, allowNull: true },
      salida: { type: Sequelize.INTEGER, allowNull: true },
      saldo: { type: Sequelize.INTEGER, allowNull: true },

      id_nombre_insumo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'nombre_insumo',
          key: 'id_nombre_insumo'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },


      id_presentacion_k: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'presentacion_k',
          key: 'id_presentacion_k'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

 
      id_casa_comercial: {
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'casa_comercial',
          key: 'id_casa_comercial'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      id_proveedor_k: {
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'proveedor_k',
          key: 'id_proveedor_k'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      lote: { type: Sequelize.STRING, allowNull: true },
      fecha_vencimiento: { type: Sequelize.DATE, allowNull: true },
      registro_invima: { type: Sequelize.STRING, allowNull: true },
      expediente_invima: { type: Sequelize.STRING, allowNull: true },
      estado_revision: { type: Sequelize.STRING, allowNull: true },
      temperatura_almacenamiento: { type: Sequelize.STRING, allowNull: true },

  
      id_clasificacion_riesgo: {
        type:Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clasificacion_riesgo',
          key: 'id_clasificacion_riesgo'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },


      principio_activo: { type: Sequelize.STRING, allowNull: true },
      forma_farmaceutica: { type: Sequelize.STRING, allowNull: true },
      concentracion: { type: Sequelize.STRING, allowNull: true },
      unidad_medida: { type: Sequelize.STRING, allowNull: true },
      fecha_salida: { type: Sequelize.DATE, allowNull: true },
      fecha_inicio: { type: Sequelize.STRING, allowNull: true },
      fecha_terminacion: { type: Sequelize.STRING, allowNull: true },
      area: { type: Sequelize.STRING, allowNull: true },
      factura: { type: Sequelize.STRING, allowNull: true },
      costo_general: { type: Sequelize.DECIMAL, allowNull: true },
      costo_caja: { type: Sequelize.DECIMAL, allowNull: true },
      costo_prueba: { type: Sequelize.DECIMAL, allowNull: true },
      iva: { type: Sequelize.DECIMAL, allowNull: true },
      consumible: { type: Sequelize.STRING, allowNull: true },
      mes_registro: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^\d{4}-(0[1-9]|1[0-2])$/
        }
        
      },
       lab_sas: {
       type: Sequelize.ENUM('lab', 'sas'),
       allowNull: false
      },

        usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
        
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
    await queryInterface.dropTable('Kardex');
  }
};