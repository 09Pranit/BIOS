import { createRoot, hydrateRoot } from 'react-dom/client';
import PublicHome from './components/PublicHome';

const root = document.getElementById('root')!;
if (root.querySelector('.public-site')) hydrateRoot(root, <PublicHome />);
else createRoot(root).render(<PublicHome />);
