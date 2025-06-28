// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';

// import './index.css';

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );import { ChakraProvider } from '@chakra-ui/react';

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* @ts-expect-error: временное отключение требования value */}
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
