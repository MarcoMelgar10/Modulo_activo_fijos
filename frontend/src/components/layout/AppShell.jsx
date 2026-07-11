import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { sectionForPath } from './navItems.js';

export function AppShell() {
  // La barra lateral es desplegable dentro de un módulo; el botón del Topbar la muestra/oculta.
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Solo se muestra la barra lateral cuando el usuario está dentro de un módulo.
  // En el menú principal (landing) no hay barra lateral: solo los módulos a elegir.
  const { pathname } = useLocation();
  const section = sectionForPath(pathname);
  const inModule = Boolean(section);

  return (
    <div className="flex h-screen overflow-hidden">
      {inModule && <Sidebar section={section} visible={sidebarVisible} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar showToggle={inModule} onToggleSidebar={() => setSidebarVisible((v) => !v)} />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
