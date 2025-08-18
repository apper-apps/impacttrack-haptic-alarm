import countriesData from "@/services/mockData/countries.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const countryService = {
  async getAll() {
    await delay(300);
    return [...countriesData];
  },

  async getById(id) {
    await delay(250);
    const country = countriesData.find(c => c.Id === parseInt(id));
    if (!country) {
      throw new Error(`Country with Id ${id} not found`);
    }
    return { ...country };
  },

  async getByCode(code) {
    await delay(250);
    const country = countriesData.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (!country) {
      throw new Error(`Country with code ${code} not found`);
    }
    return { ...country };
  },

  async create(countryData) {
    await delay(400);
    const newId = Math.max(...countriesData.map(c => c.Id), 0) + 1;
    const newCountry = {
      Id: newId,
      ...countryData
    };
    countriesData.push(newCountry);
    return { ...newCountry };
  },

  async update(id, updateData) {
    await delay(350);
    const index = countriesData.findIndex(c => c.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Country with Id ${id} not found`);
    }
    countriesData[index] = { ...countriesData[index], ...updateData };
    return { ...countriesData[index] };
  },

  async delete(id) {
    await delay(300);
    const index = countriesData.findIndex(c => c.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Country with Id ${id} not found`);
    }
    const deletedCountry = countriesData.splice(index, 1)[0];
    return { ...deletedCountry };
  }
};