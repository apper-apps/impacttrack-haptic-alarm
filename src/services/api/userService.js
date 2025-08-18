import usersData from "@/services/mockData/users.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  async getAll() {
    await delay(300);
    return [...usersData];
  },

  async getById(id) {
    await delay(250);
    const user = usersData.find(u => u.Id === parseInt(id));
    if (!user) {
      throw new Error(`User with Id ${id} not found`);
    }
    return { ...user };
  },

  async getByRole(role) {
    await delay(300);
    return usersData.filter(u => u.role.toLowerCase() === role.toLowerCase()).map(u => ({ ...u }));
  },

  async getByCountry(countryId) {
    await delay(300);
    return usersData.filter(u => u.countryId === parseInt(countryId)).map(u => ({ ...u }));
  },

  async create(userData) {
    await delay(400);
    const newId = Math.max(...usersData.map(u => u.Id), 0) + 1;
    const newUser = {
      Id: newId,
      status: "active",
      lastLogin: null,
      ...userData
    };
    usersData.push(newUser);
    return { ...newUser };
  },

  async update(id, updateData) {
    await delay(350);
    const index = usersData.findIndex(u => u.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`User with Id ${id} not found`);
    }
    usersData[index] = { ...usersData[index], ...updateData };
    return { ...usersData[index] };
  },

  async delete(id) {
    await delay(300);
    const index = usersData.findIndex(u => u.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`User with Id ${id} not found`);
    }
    const deletedUser = usersData.splice(index, 1)[0];
    return { ...deletedUser };
  }
};