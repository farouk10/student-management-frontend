// src/environments/environment.ts
// export const environment = {
//     production: false,
//     apiBaseUrl: 'http://192.168.31.94:3000', // Make sure this matches your backend
//   // apiBaseUrl: 'http://localhost:3000', // Make sure this matches your backend

//   };

const hostname = window.location.hostname;

let apiBaseUrl = 'http://localhost:3000';

switch (hostname) {
  case '192.168.31.94':
    apiBaseUrl = 'http://192.168.31.94:3000';
    break;
  case '192.168.1.17':
    apiBaseUrl = 'http://192.168.1.17:3000';
    break;
}

export const environment = {
  production: false,
  apiBaseUrl
};
  