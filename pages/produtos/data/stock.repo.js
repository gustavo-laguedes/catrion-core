// pages/produtos/data/stock.repo.js
import { CoreStorage } from "../../../core/data/storage.js";

const KEY = "core.stock.movements.v1";

export const StockRepo = {
  list() {
    return CoreStorage.get(KEY, []);
  },

  append(movement) {
    return CoreStorage.update(KEY, [], (arr) => {
      arr.push(movement);
      return arr;
    });
  },
};
