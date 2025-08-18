import organizationsData from "@/services/mockData/organizations.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const organizationService = {
  async getAll() {
    await delay(300);
    return [...organizationsData];
  },

  async getById(id) {
    await delay(250);
    const organization = organizationsData.find(org => org.Id === parseInt(id));
    if (!organization) {
      throw new Error(`Organization with Id ${id} not found`);
    }
    return { ...organization };
  },

  async create(organizationData) {
    await delay(400);
    const newId = Math.max(...organizationsData.map(org => org.Id), 0) + 1;
    const newOrganization = {
      Id: newId,
      ...organizationData
    };
    organizationsData.push(newOrganization);
    return { ...newOrganization };
  },

  async update(id, updateData) {
    await delay(350);
    const index = organizationsData.findIndex(org => org.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Organization with Id ${id} not found`);
    }
    organizationsData[index] = { ...organizationsData[index], ...updateData };
    return { ...organizationsData[index] };
  },

  async delete(id) {
    await delay(300);
    const index = organizationsData.findIndex(org => org.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Organization with Id ${id} not found`);
    }
    const deletedOrg = organizationsData.splice(index, 1)[0];
    return { ...deletedOrg };
  }
};