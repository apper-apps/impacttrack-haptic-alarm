import projectsData from "@/services/mockData/projects.json";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const projectService = {
  async getAll() {
    await delay(300);
    return [...projectsData];
  },

  async getById(id) {
    await delay(250);
    const project = projectsData.find(p => p.Id === parseInt(id));
    if (!project) {
      throw new Error(`Project with Id ${id} not found`);
    }
    return { ...project };
  },

  async getByCountry(countryId) {
    await delay(300);
    return projectsData.filter(p => p.countryId === parseInt(countryId)).map(p => ({ ...p }));
  },

  async create(projectData) {
    await delay(400);
    const newId = Math.max(...projectsData.map(p => p.Id), 0) + 1;
    const newProject = {
      Id: newId,
      ...projectData
    };
    projectsData.push(newProject);
    return { ...newProject };
  },

  async update(id, updateData) {
    await delay(350);
    const index = projectsData.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Project with Id ${id} not found`);
    }
    projectsData[index] = { ...projectsData[index], ...updateData };
    return { ...projectsData[index] };
  },

  async delete(id) {
    await delay(300);
    const index = projectsData.findIndex(p => p.Id === parseInt(id));
    if (index === -1) {
      throw new Error(`Project with Id ${id} not found`);
    }
    const deletedProject = projectsData.splice(index, 1)[0];
    return { ...deletedProject };
  }
};