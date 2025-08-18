// Mock delay function for API simulation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const bulkImportService = {
  async parseFile(file) {
    await delay(800);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let data, headers;
          
          if (file.type === 'text/csv') {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length === 0) {
              reject(new Error('File is empty'));
              return;
            }
            
            headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          } else {
            // For Excel files, we'll simulate parsing
            // In a real implementation, you'd use a library like xlsx
            reject(new Error('Excel file parsing not implemented in this demo. Please use CSV files.'));
            return;
          }
          
          resolve({ headers, data: data.filter(row => Object.values(row).some(v => v)) });
        } catch (error) {
          reject(new Error('Failed to parse file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  },

  async validateData(fileData, mappings, referenceData) {
    await delay(1000);
    
    const { indicators, countries, projects } = referenceData;
    const validRows = [];
    const errors = [];
    const warnings = [];
    
    // Reverse mapping for easier lookup
    const fieldMapping = {};
    Object.entries(mappings).forEach(([header, field]) => {
      if (field) fieldMapping[field] = header;
    });
    
    fileData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header
      const validatedRow = {};
      let hasErrors = false;
      
      // Validate required fields
      if (!fieldMapping.indicator || !row[fieldMapping.indicator]) {
        errors.push({ row: rowNumber, message: 'Missing indicator name' });
        hasErrors = true;
      } else {
        const indicatorName = row[fieldMapping.indicator].trim();
        const indicator = indicators.find(i => 
          i.name.toLowerCase() === indicatorName.toLowerCase()
        );
        if (!indicator) {
          errors.push({ 
            row: rowNumber, 
            message: `Unknown indicator: ${indicatorName}` 
          });
          hasErrors = true;
        } else {
          validatedRow.indicator = indicator.name;
          validatedRow.indicatorId = indicator.Id;
        }
      }
      
      if (!fieldMapping.value || !row[fieldMapping.value]) {
        errors.push({ row: rowNumber, message: 'Missing value' });
        hasErrors = true;
      } else {
        const value = parseFloat(row[fieldMapping.value]);
        if (isNaN(value)) {
          errors.push({ 
            row: rowNumber, 
            message: `Invalid numeric value: ${row[fieldMapping.value]}` 
          });
          hasErrors = true;
        } else {
          validatedRow.value = value;
        }
      }
      
      // Validate optional fields
      if (fieldMapping.country && row[fieldMapping.country]) {
        const countryName = row[fieldMapping.country].trim();
        const country = countries.find(c => 
          c.name.toLowerCase() === countryName.toLowerCase()
        );
        if (!country) {
          warnings.push({ 
            row: rowNumber, 
            message: `Unknown country: ${countryName}. Will use selected country.` 
          });
        } else {
          validatedRow.country = country.name;
          validatedRow.countryId = country.Id;
        }
      }
      
      if (fieldMapping.project && row[fieldMapping.project]) {
        const projectName = row[fieldMapping.project].trim();
        const project = projects.find(p => 
          p.name.toLowerCase() === projectName.toLowerCase()
        );
        if (!project) {
          warnings.push({ 
            row: rowNumber, 
            message: `Unknown project: ${projectName}. Will use selected project.` 
          });
        } else {
          validatedRow.project = project.name;
          validatedRow.projectId = project.Id;
        }
      }
      
      if (fieldMapping.reportingDate && row[fieldMapping.reportingDate]) {
        const dateStr = row[fieldMapping.reportingDate].trim();
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          warnings.push({ 
            row: rowNumber, 
            message: `Invalid date format: ${dateStr}. Will use current date.` 
          });
        } else {
          validatedRow.reportingDate = date.toISOString().split('T')[0];
        }
      }
      
      if (fieldMapping.notes && row[fieldMapping.notes]) {
        validatedRow.notes = row[fieldMapping.notes].trim();
      }
      
      if (!hasErrors) {
        validRows.push(validatedRow);
      }
    });
    
    return { validRows, errors, warnings };
  },

  downloadTemplate(sampleData, filename) {
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};