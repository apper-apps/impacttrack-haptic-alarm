import indicatorsData from "@/services/mockData/indicators.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const indicatorService = {
  async getAll() {
    await delay(300);
    return [...indicatorsData];
  },

  async getById(id) {
    await delay(250);
    const indicator = indicatorsData.find(ind => ind.Id === parseInt(id));
    if (!indicator) {
      throw new Error(`Indicator with Id ${id} not found`);
    }
    return { ...indicator };
  },

  async getByCategory(category) {
    await delay(300);
    return indicatorsData.filter(ind => ind.category.toLowerCase() === category.toLowerCase()).map(ind => ({ ...ind }));
  },

  async create(indicatorData) {
    await delay(400);
    const newId = Math.max(...indicatorsData.map(ind => ind.Id), 0) + 1;
    const newIndicator = {
      Id: newId,
      ...indicatorData
    };
    indicatorsData.push(newIndicator);
    return { ...newIndicator };
  },

  async update(id, updateData) {
    await delay(350);
    const index = indicatorsData.findIndex(ind => ind.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Indicator with Id ${id} not found`);
    }
    indicatorsData[index] = { ...indicatorsData[index], ...updateData };
    return { ...indicatorsData[index] };
  },

  async delete(id) {
    await delay(300);
    const index = indicatorsData.findIndex(ind => ind.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Indicator with Id ${id} not found`);
    }
    const deletedIndicator = indicatorsData.splice(index, 1)[0];
    return { ...deletedIndicator };
  }
};