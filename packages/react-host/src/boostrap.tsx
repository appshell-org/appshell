/* eslint-disable react/jsx-props-no-spreading */
import { APPSHELL_ENV } from '@appshell/core';
import { ReactHost } from '@appshell/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Splash from './components/Splash';
import reportWebVitals from './reportWebVitals';
import './reset.css';
import { initializeAppshellServiceWorker } from './worker/initialize';

const root = createRoot(document.getElementById('root') as HTMLElement);
const props = JSON.parse(APPSHELL_ENV.APPSHELL_ROOT_PROPS);

initializeAppshellServiceWorker().then(() => {
  root.render(
    <React.StrictMode>
      <ReactHost
        configUrl={APPSHELL_ENV.APPSHELL_CONFIG_URL}
        remote={APPSHELL_ENV.APPSHELL_ROOT}
        fallback={<Splash />}
        {...props}
      />
    </React.StrictMode>,
  );
});

reportWebVitals();
