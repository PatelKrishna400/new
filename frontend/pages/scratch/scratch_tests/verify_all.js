const fs = require('fs');

const index = fs.readFileSync('frontend/index.html', 'utf8');
const energyHtml = fs.readFileSync('frontend/pages/energy/energy.html', 'utf8');
const energyJs = fs.readFileSync('frontend/pages/energy/energy.js', 'utf8');
const energyCss = fs.readFileSync('frontend/pages/energy/energy.css', 'utf8');
const profileJs = fs.readFileSync('frontend/pages/profile/profile.js', 'utf8');
const stateJs = fs.readFileSync('frontend/shared/state.js', 'utf8');
const fbJs = fs.readFileSync('frontend/shared/firebase-service.js', 'utf8');

console.log('1. index.html has fuelCardBlue:', index.includes('fuelCardBlue'));
console.log('2. index.html has fuelCardLightBlue:', index.includes('fuelCardLightBlue'));
console.log('3. index.html has blueCellCount:', index.includes('blueCellCount'));
console.log('4. index.html has lightblueCellCount:', index.includes('lightblueCellCount'));
console.log('5. energy.html has 30s skip text:', energyHtml.includes('30s Generator Timer Skip'));
console.log('6. energy.html has 1 Min skip text:', energyHtml.includes('1 Min Generator Timer Skip'));
console.log('7. energy.js has executeTimeSkip:', energyJs.includes('executeTimeSkip'));
console.log('8. energy.js has blue handling:', energyJs.includes("fuelType === 'blue'"));
console.log('9. energy.js has lightblue handling:', energyJs.includes("fuelType === 'lightblue'"));
console.log('10. energy.css has .blue-fuel-card:', energyCss.includes('.blue-fuel-card'));
console.log('11. energy.css has .lightblue-fuel-card:', energyCss.includes('.lightblue-fuel-card'));
console.log('12. profile.js has blue in shop meta:', profileJs.includes("name: 'Blue Fuel Cell'"));
console.log('13. profile.js has lightblue in shop meta:', profileJs.includes("name: 'Light Blue Fuel Cell'"));
console.log('14. state.js has blue in fuelCells:', stateJs.includes('blue: 0'));
console.log('15. state.js has lightblue in fuelCells:', stateJs.includes('lightblue: 0'));
console.log('16. firebase-service.js has blue in reset:', fbJs.includes('blue: 0'));
console.log('17. firebase-service.js has lightblue in reset:', fbJs.includes('lightblue: 0'));
