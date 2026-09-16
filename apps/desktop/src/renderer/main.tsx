import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Renderer root element is missing');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
