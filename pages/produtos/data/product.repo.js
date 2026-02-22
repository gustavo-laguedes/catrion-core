// pages/produtos/data/product.repo.js
import { CoreStorage } from "../../../core/data/storage.js";

const KEY = "core.products.v1";

export const ProductRepo = {
  list() {
    return CoreStorage.get(KEY, []);
  },

  saveAll(products) {
    CoreStorage.set(KEY, products);
    return products;
  },
};
