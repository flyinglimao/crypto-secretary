"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chain extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Chain.init(
    {
      lastHeight: DataTypes.STRING,
      chain: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Chain",
    }
  );
  return Chain;
};
