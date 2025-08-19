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

  async getActiveCountries() {
    await delay(300);
    return countriesData.filter(c => c.status === 'active').map(c => ({ ...c }));
  },

  async getCountryStats(id) {
    await delay(250);
    const country = await this.getById(id);
    
    // Calculate performance statistics
    const currentQuarterTarget = Math.round(country.totalReach * 0.25); // 25% of annual target
    const achievementRate = currentQuarterTarget > 0 ? 
      Math.round((country.totalReach * 0.15) / currentQuarterTarget * 100) : 0; // Assume 15% achieved
    
    return {
      ...country,
      currentQuarterTarget,
      achievementRate,
      status: achievementRate >= 90 ? 'On Track' : 
              achievementRate >= 70 ? 'Needs Attention' : 'Critical',
      statusColor: achievementRate >= 90 ? 'success' : 
                   achievementRate >= 70 ? 'warning' : 'error'
    };
  },

  async getCountriesByStatus(status) {
    await delay(300);
    if (status === 'All') {
      return [...countriesData];
    }
    return countriesData.filter(c => c.status === status).map(c => ({ ...c }));
  },

  async create(countryData) {
    await delay(400);
    const newId = Math.max(...countriesData.map(c => c.Id), 0) + 1;
    const newCountry = {
      Id: newId,
      status: 'active',
      activeProjects: 0,
      totalReach: 0,
      femaleParticipation: 0,
      ...countryData,
      createdAt: new Date().toISOString()
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
    countriesData[index] = { 
      ...countriesData[index], 
      ...updateData,
      updatedAt: new Date().toISOString()
    };
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