// src/sentinel/core/ModelCache.js
import { openDB } from 'idb';

class ModelCache {
  constructor() {
    this.dbName = 'sentinel-models';
    this.storeName = 'models';
    this.db = null;
  }

  async init() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'name' });
        }
      }
    });
  }

  async saveModel(name, data, metadata) {
    const entry = {
      name,
      data,
      metadata,
      timestamp: Date.now(),
      size: data.byteLength || JSON.stringify(data).length
    };

    await this.db.put(this.storeName, entry);
    return true;
  }

  async loadModel(name) {
    const entry = await this.db.get(this.storeName, name);
    
    if (!entry) return null;

    // Check if model is stale (older than 7 days)
    const age = Date.now() - entry.timestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) {
      await this.deleteModel(name);
      return null;
    }

    return entry.data;
  }

  async deleteModel(name) {
    await this.db.delete(this.storeName, name);
  }

  async clearOldModels(maxSizeMB = 100) {
    const allModels = await this.db.getAll(this.storeName);
    
    // Sort by timestamp (oldest first)
    allModels.sort((a, b) => a.timestamp - b.timestamp);
    
    let totalSize = 0;
    const toDelete = [];
    
    // Calculate total size and mark old models for deletion
    for (const model of allModels) {
      totalSize += model.size;
      
      if (totalSize > maxSizeMB * 1024 * 1024) {
        toDelete.push(model.name);
      }
    }

    // Delete marked models
    for (const name of toDelete) {
      await this.deleteModel(name);
    }

    return toDelete.length;
  }

  async getStorageInfo() {
    const allModels = await this.db.getAll(this.storeName);
    
    const totalSize = allModels.reduce((sum, model) => sum + model.size, 0);
    const count = allModels.length;

    return {
      count,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      models: allModels.map(m => ({
        name: m.name,
        sizeMB: (m.size / 1024 / 1024).toFixed(2),
        age: Math.floor((Date.now() - m.timestamp) / (1000 * 60 * 60 * 24)) + ' days'
      }))
    };
  }
}

export default ModelCache;
